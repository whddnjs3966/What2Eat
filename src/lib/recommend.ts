// 추천 알고리즘 v2 — 필터링 + 다층 가중치 스코어링 + 시너지 보너스 + 다양성 보장
import { MenuItem, menuDatabase } from "@/data/menuDatabase";
import { Selections } from "@/store/useAppStore";

interface ScoredMenu {
    menu: MenuItem;
    score: number;
    breakdown?: Record<string, number>; // 디버깅용
}

// ===== 시너지 보너스 정의 =====
// 특정 조합이 선택되면 해당 태그를 가진 메뉴에 추가 점수
const SYNERGY_RULES: {
    conditions: Partial<Record<keyof Selections, string | string[]>>;
    bonus: { tag: string; category: keyof MenuItem["tags"]; points: number };
    label: string;
}[] = [
    // 비 + 뜨거운 → 국찌개 보너스
    {
        conditions: { context: "비", temperature: "뜨거운" },
        bonus: { tag: "국찌개", category: "dishType", points: 15 },
        label: "비+뜨거운=국물",
    },
    // 비 → 파전/전류 보너스 (빵분식 중)
    {
        conditions: { context: "비" },
        bonus: { tag: "빵분식", category: "dishType", points: 8 },
        label: "비=분식",
    },
    // 추운날 + 국찌개 → 매콤 보너스
    {
        conditions: { context: "추운날", dishType: "국찌개" },
        bonus: { tag: "매콤", category: "taste", points: 10 },
        label: "추운날+국찌개=매콤",
    },
    // 더운날 → 차가운 음식 보너스
    {
        conditions: { context: "더운날" },
        bonus: { tag: "차가운", category: "temperature", points: 15 },
        label: "더운날=차가운",
    },
    // 해장 + 아침 → 국물 요리 강화
    {
        conditions: { context: "해장", mealTime: "아침" },
        bonus: { tag: "국찌개", category: "dishType", points: 20 },
        label: "아침해장=국물",
    },
    // 다이어트 → 저칼로리 보너스
    {
        conditions: { context: "다이어트" },
        bonus: { tag: "저칼로리", category: "dishType", points: 15 },
        label: "다이어트=저칼",
    },
    // 혼밥 + 시간없어 → 빠른 음식 보너스
    {
        conditions: { companion: "혼밥", context: "시간없어" },
        bonus: { tag: "빵분식", category: "dishType", points: 10 },
        label: "혼밥+시간없어=분식",
    },
    // 회식 → 고기구이 보너스
    {
        conditions: { companion: "회식" },
        bonus: { tag: "고기구이", category: "dishType", points: 12 },
        label: "회식=고기",
    },
    // 연인 → 양식 보너스
    {
        conditions: { companion: "연인" },
        bonus: { tag: "양식", category: "cuisine", points: 8 },
        label: "연인=양식",
    },
];

// ===== 포만감 선호도 매핑 =====
const SATIETY_PREFERENCE: Record<string, string[]> = {
    "아침": ["가벼움", "적당함"],
    "점심": ["적당함", "든든함"],
    "저녁": ["든든함", "배터짐"],
    "야식": ["가벼움", "적당함"],
    "간식": ["가벼움"],
};

// ===== 시간대별 요리 스타일 선호도 =====
const MEALTIME_DISHTYPE_AFFINITY: Record<string, Record<string, number>> = {
    "아침": { "밥": 5, "빵분식": 8, "국찌개": 5, "디저트": 3, "면": -5 },
    "점심": { "밥": 5, "면": 5, "국찌개": 3, "고기구이": 0 },
    "저녁": { "고기구이": 8, "국찌개": 5, "면": 3, "밥": 0 },
    "야식": { "빵분식": 5, "면": 5, "고기구이": 3, "디저트": 3 },
    "간식": { "디저트": 10, "빵분식": 8, "샐러드": 3, "면": -5 },
};

/**
 * 시너지 조건이 현재 selections에 매칭되는지 확인
 */
function checkSynergyCondition(
    conditions: Partial<Record<keyof Selections, string | string[]>>,
    selections: Selections
): boolean {
    return Object.entries(conditions).every(([key, value]) => {
        const sel = selections[key as keyof Selections];
        if (sel === null || sel === undefined) return false;
        if (Array.isArray(sel)) {
            // taste같은 배열 필드
            if (Array.isArray(value)) {
                return value.some((v) => sel.includes(v));
            }
            return sel.includes(value as string);
        }
        return sel === value;
    });
}

/**
 * 8단계 선택을 기반으로 메뉴를 추천합니다.
 *
 * v2 알고리즘:
 * 1. 하드 필터: cuisine, dishType 불일치 항목 제거
 * 2. 다층 가중치 스코어링:
 *    - 기본 태그 매칭 (시간, 동행, 맛, 온도, 예산)
 *    - 식감(texture) 매칭
 *    - 포만감(satiety) 적합도
 *    - 시간대별 요리 스타일 친화도
 *    - 시너지 보너스 (조합 효과)
 *    - 날씨 컨텍스트 연동
 *    - 다이어트 모드 칼로리 가중치
 * 3. 다양성 보장: alternatives는 다른 cuisine/dishType에서 선택
 * 4. 가중 랜덤 선택 (상위 점수 편향 + 적당한 변동성)
 */
export function recommendMenu(
    selections: Selections,
    excludeIds: string[] = [],
    weatherTemp?: number | null
): { recommended: MenuItem | null; alternatives: MenuItem[] } {
    let db = menuDatabase.filter((m) => !excludeIds.includes(m.id));

    // === Step 0: 하드 필터 ===
    if (selections.cuisine && selections.cuisine !== "상관없음") {
        const filtered = db.filter((m) => m.tags.cuisine.includes(selections.cuisine!));
        if (filtered.length >= 3) db = filtered;
    }
    if (selections.dishType && selections.dishType !== "상관없음") {
        const filtered = db.filter((m) => m.tags.dishType.includes(selections.dishType!));
        if (filtered.length >= 2) db = filtered;
    }

    // === Step 1: 다층 스코어링 ===
    const scored: ScoredMenu[] = db.map((menu) => {
        let score = 0;
        const breakdown: Record<string, number> = {};

        // --- 1a. 시간대 매칭 (핵심, 높은 가중치) ---
        if (selections.mealTime) {
            if (menu.tags.mealTime.includes(selections.mealTime)) {
                score += 30;
                breakdown["mealTime"] = 30;
            } else {
                score -= 80; // 시간대 불일치는 치명적
                breakdown["mealTime"] = -80;
            }
        }

        // --- 1b. 동행 인원 매칭 ---
        if (selections.companion) {
            if (menu.tags.companion.includes(selections.companion)) {
                score += 20;
                breakdown["companion"] = 20;
            } else {
                score -= 15;
                breakdown["companion"] = -15;
            }
        }

        // --- 1c. 맛 선호 매칭 (복수 선택, 비율 기반) ---
        if (selections.taste.length > 0) {
            const tasteMatches = selections.taste.filter((t) =>
                menu.tags.taste.includes(t)
            ).length;
            const matchRatio = tasteMatches / selections.taste.length;
            // 일치 비율이 높을수록 보너스, 0이면 패널티
            const tasteScore = tasteMatches > 0
                ? tasteMatches * 20 + Math.round(matchRatio * 15)
                : -30;
            score += tasteScore;
            breakdown["taste"] = tasteScore;
        }

        // --- 1d. 온도 선호 매칭 ---
        if (selections.temperature && selections.temperature !== "상온") {
            if (menu.tags.temperature.includes(selections.temperature)) {
                score += 15;
                breakdown["temperature"] = 15;
            } else {
                score -= 20;
                breakdown["temperature"] = -20;
            }
        }

        // --- 1e. 가격대 매칭 ---
        if (selections.budget && selections.budget !== "상관없음") {
            if (menu.tags.budget.includes(selections.budget)) {
                score += 15;
                breakdown["budget"] = 15;
            } else {
                score -= 10;
                breakdown["budget"] = -10;
            }
        }

        // --- 1f. 특수 상황 매칭 (보너스 Only, 패널티 없음) ---
        if (selections.context && selections.context !== "패스") {
            if (menu.tags.context.includes(selections.context)) {
                score += 25;
                breakdown["context"] = 25;
            }
        }

        // --- 1g. 식감(texture) 매칭 (새로 추가) ---
        // taste와 함께 음식의 감각적 경험을 반영
        if (selections.taste.length > 0) {
            // 맛 선호에 따라 선호할 만한 식감 추정
            const textureAffinities: Record<string, string[]> = {
                "매콤": ["쫄깃", "탱글"],
                "고소": ["바삭", "부드러움", "꾸덕"],
                "새콤": ["아삭", "탱글"],
                "담백": ["부드러움", "아삭"],
                "달콤": ["부드러움", "촉촉", "바삭"],
                "얼얼": ["쫄깃", "아삭"],
            };
            const preferredTextures = new Set(
                selections.taste.flatMap((t) => textureAffinities[t] || [])
            );
            if (preferredTextures.size > 0) {
                const textureMatches = menu.tags.texture.filter((t) =>
                    preferredTextures.has(t)
                ).length;
                const texScore = textureMatches * 5;
                score += texScore;
                breakdown["texture"] = texScore;
            }
        }

        // --- 1h. 포만감 적합도 (시간대 기반) ---
        if (selections.mealTime && SATIETY_PREFERENCE[selections.mealTime]) {
            const preferred = SATIETY_PREFERENCE[selections.mealTime];
            if (preferred.includes(menu.tags.satiety)) {
                score += 8;
                breakdown["satiety"] = 8;
            } else if (
                // 야식에 배터짐, 아침에 배터짐은 살짝 패널티
                (selections.mealTime === "야식" && menu.tags.satiety === "배터짐") ||
                (selections.mealTime === "아침" && menu.tags.satiety === "배터짐") ||
                (selections.mealTime === "간식" && (menu.tags.satiety === "든든함" || menu.tags.satiety === "배터짐"))
            ) {
                score -= 5;
                breakdown["satiety"] = -5;
            }
        }

        // --- 1i. 시간대별 요리 스타일 친화도 ---
        if (selections.mealTime && MEALTIME_DISHTYPE_AFFINITY[selections.mealTime]) {
            const affinityMap = MEALTIME_DISHTYPE_AFFINITY[selections.mealTime];
            for (const dt of menu.tags.dishType) {
                if (affinityMap[dt] !== undefined) {
                    score += affinityMap[dt];
                    breakdown["dishTimeAffinity"] = (breakdown["dishTimeAffinity"] || 0) + affinityMap[dt];
                }
            }
        }

        // --- 1j. 시너지 보너스 ---
        for (const rule of SYNERGY_RULES) {
            if (checkSynergyCondition(rule.conditions, selections)) {
                // 다이어트 시너지는 특수 처리: 칼로리 체크
                if (rule.label === "다이어트=저칼") {
                    if (menu.calories === "저칼로리") {
                        score += rule.bonus.points;
                        breakdown[`synergy:${rule.label}`] = rule.bonus.points;
                    } else if (menu.calories === "고칼로리") {
                        score -= 15;
                        breakdown[`synergy:anti-diet`] = -15;
                    }
                } else {
                    // 일반 시너지: 해당 카테고리의 태그가 일치하면 보너스
                    const menuTags = menu.tags[rule.bonus.category as keyof MenuItem["tags"]];
                    if (Array.isArray(menuTags) && menuTags.includes(rule.bonus.tag)) {
                        score += rule.bonus.points;
                        breakdown[`synergy:${rule.label}`] = rule.bonus.points;
                    }
                }
            }
        }

        // --- 1k. 날씨 온도 연동 (전달받은 실제 기온) ---
        if (weatherTemp !== undefined && weatherTemp !== null) {
            if (weatherTemp >= 28 && menu.tags.temperature.includes("차가운")) {
                score += 8;
                breakdown["weatherTemp"] = 8;
            } else if (weatherTemp <= 5 && menu.tags.temperature.includes("뜨거운")) {
                score += 8;
                breakdown["weatherTemp"] = 8;
            }
        }

        return { menu, score, breakdown };
    });

    // === Step 2: 점수 기준 정렬 ===
    scored.sort((a, b) => b.score - a.score);

    // === Step 3: 후보 선정 + 다양성 보장 ===
    const positives = scored.filter((s) => s.score > 0);
    const candidates = positives.length >= 3
        ? positives.slice(0, 10)
        : scored.slice(0, 8); // fallback

    if (candidates.length === 0) {
        return { recommended: null, alternatives: [] };
    }

    // 가중 랜덤 선택 (상위 편향 + 적당한 변동성)
    const recommended = weightedRandomPick(candidates);

    // === Step 4: 다양성 있는 alternatives 선택 ===
    const alternatives = pickDiverseAlternatives(
        candidates.filter((c) => c.menu.id !== recommended.id),
        recommended,
        3
    );

    return {
        recommended: recommended,
        alternatives: alternatives.map((a) => a.menu),
    };
}

/**
 * 가중 랜덤 선택 — 점수가 높을수록 뽑힐 확률이 높지만 변동성 존재
 */
function weightedRandomPick(candidates: ScoredMenu[]): MenuItem {
    if (candidates.length === 0) return menuDatabase[0]; // fallback
    if (candidates.length === 1) return candidates[0].menu;

    const topScore = candidates[0].score;
    const minScore = Math.max(candidates[candidates.length - 1].score, 1);

    // 점수를 0~1로 정규화 후 제곱으로 상위 편향
    const weights = candidates.map((c) => {
        const normalized = (c.score - minScore + 1) / (topScore - minScore + 1);
        return Math.pow(normalized, 1.8) + 0.05; // 0.05 최소 가중치로 변동성 보장
    });

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < candidates.length; i++) {
        random -= weights[i];
        if (random <= 0) {
            return candidates[i].menu;
        }
    }

    return candidates[0].menu;
}

/**
 * 다양한 alternatives 선택 — cuisine과 dishType이 겹치지 않게
 */
function pickDiverseAlternatives(
    pool: ScoredMenu[],
    recommended: MenuItem,
    count: number
): ScoredMenu[] {
    if (pool.length <= count) return pool;

    const result: ScoredMenu[] = [];
    const usedCuisines = new Set(recommended.tags.cuisine);
    const usedDishTypes = new Set(recommended.tags.dishType);

    // 1차: 다른 cuisine/dishType에서 선택
    for (const candidate of pool) {
        if (result.length >= count) break;
        const hasDiffCuisine = candidate.menu.tags.cuisine.some((c) => !usedCuisines.has(c));
        const hasDiffDishType = candidate.menu.tags.dishType.some((d) => !usedDishTypes.has(d));

        if (hasDiffCuisine || hasDiffDishType) {
            result.push(candidate);
            candidate.menu.tags.cuisine.forEach((c) => usedCuisines.add(c));
            candidate.menu.tags.dishType.forEach((d) => usedDishTypes.add(d));
        }
    }

    // 2차: 부족하면 점수 순으로 채움
    if (result.length < count) {
        for (const candidate of pool) {
            if (result.length >= count) break;
            if (!result.includes(candidate)) {
                result.push(candidate);
            }
        }
    }

    return result;
}

/**
 * 날씨 기반 가중치 조정을 위한 상황 매핑
 */
export function getWeatherContext(
    temp: number | null,
    condition: string | null
): string | null {
    const c = condition?.toLowerCase() ?? "";
    if (c.includes("rain") || c.includes("drizzle") || c.includes("thunderstorm")) {
        return "비";
    }
    if (temp !== null) {
        if (temp >= 30) return "더운날";
        if (temp <= 5) return "추운날";
    }
    return null;
}

/**
 * 추천 이유 문구 생성 (v2: 더 다양한 이유 조합)
 */
export function getRecommendReason(
    menu: MenuItem,
    selections: Selections
): string {
    const reasons: string[] = [];

    // 1. 특수 상황 매칭
    if (selections.context && selections.context !== "패스" && menu.tags.context.includes(selections.context)) {
        const contextMap: Record<string, string> = {
            "해장": "속이 풀리는 해장 메뉴로 딱이에요!",
            "다이어트": "가볍고 건강하게 즐길 수 있어요!",
            "컨디션": "몸이 안 좋을 때 부담 없이 먹기 좋아요.",
            "비": "비 오는 날 분위기와 찰떡이에요!",
            "더운날": "더운 날씨에 딱 맞는 선택이에요!",
            "추운날": "추운 날 몸을 따뜻하게 녹여줄 거예요.",
            "기분좋은날": "좋은 날엔 맛있는 걸로 기분 UP!",
            "시간없어": "빠르게 든든하게 해결할 수 있어요!",
        };
        if (contextMap[selections.context]) reasons.push(contextMap[selections.context]);
    }

    // 2. 맛 매칭
    if (selections.taste.length > 0) {
        const matched = selections.taste.filter((t) => menu.tags.taste.includes(t));
        if (matched.length > 0) {
            reasons.push(`${matched.join(" + ")} 맛을 좋아하신다면 강력 추천!`);
        }
    }

    // 3. 동행 매칭
    if (selections.companion) {
        const compMap: Record<string, string> = {
            "혼밥": "혼자서도 편하게 즐기기 좋아요.",
            "연인": "데이트 메뉴로 분위기 있는 선택!",
            "친구": "친구들과 나눠 먹으면 더 맛있어요!",
            "가족": "온 가족이 함께 즐기기 좋은 메뉴예요.",
            "회식": "다 같이 먹으면 분위기 최고!",
        };
        if (compMap[selections.companion] && menu.tags.companion.includes(selections.companion)) {
            reasons.push(compMap[selections.companion]);
        }
    }

    // 4. 식감 하이라이트
    if (menu.tags.texture.length > 0) {
        const textureDesc: Record<string, string> = {
            "바삭": "바삭한 식감이 매력적이에요!",
            "쫄깃": "쫄깃한 식감이 일품이에요!",
            "부드러움": "부드럽게 넘어가는 맛이 좋아요.",
            "아삭": "아삭한 채소가 식감을 더해요!",
            "꾸덕": "꾸덕한 식감이 중독적이에요!",
        };
        const texMatch = menu.tags.texture.find((t) => textureDesc[t]);
        if (texMatch && reasons.length < 2) {
            reasons.push(textureDesc[texMatch]);
        }
    }

    // 최대 2개의 이유를 합쳐서 반환
    if (reasons.length >= 2) {
        return reasons.slice(0, 2).join(" ");
    }
    return reasons[0] || menu.description;
}

/**
 * 날씨와 기온에 따른 상세 추천 문구 생성
 */
export function getWeatherRecommendation(temp: number | null, condition: string | null): string {
    if (!condition) return "오늘 같은 날씨엔 맛있는 한 끼로 기분 전환! 🍽️";

    const t = temp ?? 20; // default temp
    const c = condition.toLowerCase();

    const getRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

    // 1. 눈/비 (최우선)
    if (c.includes("rain") || c.includes("drizzle") || c.includes("thunderstorm")) {
        return getRandom([
            "비 오는 날엔 따끈한 국물이나 바삭한 파전 어때요? ☔️",
            "빗소리 들으며 즐기는 삼겹살에 소주 한 잔! 🥓",
            "비 올 땐 얼큰한 짬뽕 국물이 최고죠! 🍜",
            "비 오는 날 감성 돋는 칼국수 한 그릇! 🥢",
            "우산 쓰고 따뜻한 국밥 한 그릇 어떠세요? 🍚"
        ]);
    }
    if (c.includes("snow")) {
        return getRandom([
            "눈 내리는 날엔 김이 모락모락 나는 우동 한 그릇! ❄️",
            "추운 날엔 따뜻한 전골 요리가 딱이에요! 🥘",
            "흰 눈이 오면 분위기 있는 스테이크 썰어볼까요? 🍽️",
            "눈 오는 날, 호호 불며 먹는 군고구마와 라떼! 🍠"
        ]);
    }

    // 2. 기온별 추천
    if (t >= 30) {
        return getRandom([
            "폭염 주의! 살얼음 동동 띄운 시원한 냉면! 🧊",
            "오늘 너무 덥죠? 시원한 콩국수로 더위 사냥! 🥢",
            "더위에 지친 몸, 삼계탕으로 이열치열 몸보신! 🐔",
            "입맛 없을 땐 새콤달콤한 비빔국수 어때요? 🥗"
        ]);
    }
    if (t >= 25) {
        return getRandom([
            "더운 날씨엔 시원한 메밀소바나 초밥 어때요? 🍣",
            "시원한 맥주와 함께 즐기는 타코는 어떠세요? 🌮",
            "가볍게 즐기는 샐러드 보울로 상큼하게! 🥗"
        ]);
    }
    if (t <= 0) {
        return getRandom([
            "꽁꽁 언 날씨엔 뜨끈한 순대국밥이나 김치찌개! 🍲",
            "추울 땐 보글보글 부대찌개가 생각나지 않나요? 🥘",
            "몸 녹이는 따뜻한 핫초코와 디저트가 땡기는 날! ☕"
        ]);
    }
    if (t <= 10) {
        return getRandom([
            "쌀쌀한 바람 부는 날엔 따뜻한 라멘이나 쌀국수! 🍜",
            "몸을 따뜻하게 해줄 죽이나 숭늉은 어때요? 🥣",
            "따뜻한 온메밀이나 우동으로 몸 녹이기! 🥢"
        ]);
    }

    // 3. 날씨 상태별 추천 (기온이 적당할 때)
    if (c.includes("cloud") || c.includes("overcast")) {
        return getRandom([
            "구름 낀 흐린 날엔 매콤한 떡볶이나 짬뽕으로 기분 전환! 🌶️",
            "흐린 날씨엔 기름진 전이나 튀김이 땡기지 않나요? 🍤",
            "기분 전환이 필요할 땐 달달한 디저트 타임! 🍰"
        ]);
    }
    if (c.includes("clear") || c.includes("sunny")) {
        return getRandom([
            "화창한 날씨엔 가벼운 샌드위치나 브런치 어때요? 🥗",
            "햇살 좋은 날, 테라스에서 파스타 어떠세요? 🍝",
            "날씨가 너무 좋아요! 소풍 가는 기분으로 김밥? 🍙",
            "맑은 날씨엔 뷰 좋은 카페에서 브런치! ☕"
        ]);
    }
    if (c.includes("mist") || c.includes("fog") || c.includes("haze")) {
        return getRandom([
            "안개 낀 날엔 분위기 있게 파스타나 스테이크! 🍷",
            "몽환적인 날씨, 따뜻한 차 한 잔과 스콘? 🍵"
        ]);
    }

    // 4. 기본 (적당한 날씨)
    return getRandom([
        "선선한 날씨엔 든든한 덮밥이나 가정식 백반 어때요? 🍚",
        "오늘 같은 날씨엔 치킨에 맥주가 딱! 🍗",
        "특별한 날, 초밥으로 깔끔한 한 끼! 🍣",
        "맛있는 한 끼로 오늘 하루 힘내세요! 💪"
    ]);
}
