// 추천 알고리즘 v3 — 고도화: 조리법 스코어링 + 가중치 균형 + 식감 질문 반영 + 다양성 강화
import { MenuItem, menuDatabase } from "@/data/menuDatabase";
import { Selections } from "@/store/useAppStore";

interface ScoredMenu {
    menu: MenuItem;
    score: number;
    breakdown?: Record<string, number>; // 디버깅용
}

// ===== 시너지 보너스 정의 =====
const SYNERGY_RULES: {
    conditions: Partial<Record<keyof Selections, string | string[]>>;
    bonus: { tag: string; category: keyof MenuItem["tags"]; points: number };
    label: string;
}[] = [
        // 비 + 뜨거운 → 국찌개 보너스
        {
            conditions: { context: "비", temperature: "뜨거운" },
            bonus: { tag: "국찌개", category: "dishType", points: 12 },
            label: "비+뜨거운=국물",
        },
        // 비 → 파전/전류 보너스
        {
            conditions: { context: "비" },
            bonus: { tag: "빵분식", category: "dishType", points: 6 },
            label: "비=분식",
        },
        // 추운날 + 국찌개 → 매콤 보너스
        {
            conditions: { context: "추운날", dishType: "국찌개" },
            bonus: { tag: "매콤", category: "taste", points: 8 },
            label: "추운날+국찌개=매콤",
        },
        // 더운날 → 차가운 음식 보너스
        {
            conditions: { context: "더운날" },
            bonus: { tag: "차가운", category: "temperature", points: 12 },
            label: "더운날=차가운",
        },
        // 해장 + 아침 → 국물 요리 강화
        {
            conditions: { context: "해장", mealTime: "아침" },
            bonus: { tag: "국찌개", category: "dishType", points: 15 },
            label: "아침해장=국물",
        },
        // 다이어트 → 저칼로리 보너스
        {
            conditions: { context: "다이어트" },
            bonus: { tag: "저칼로리", category: "dishType", points: 12 },
            label: "다이어트=저칼",
        },
        // 혼밥 + 시간없어 → 빠른 음식 보너스
        {
            conditions: { companion: "혼밥", context: "시간없어" },
            bonus: { tag: "빵분식", category: "dishType", points: 8 },
            label: "혼밥+시간없어=분식",
        },
        // 회식 → 고기구이 보너스
        {
            conditions: { companion: "회식" },
            bonus: { tag: "고기구이", category: "dishType", points: 10 },
            label: "회식=고기",
        },
        // 연인 → 양식 보너스
        {
            conditions: { companion: "연인" },
            bonus: { tag: "양식", category: "cuisine", points: 6 },
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
 * 태그 매칭 스코어 헬퍼 — 선택값이 없으면 0, 일치하면 bonus, 불일치하면 penalty
 */
function scoreTagMatch(
    selected: string[],
    menuTags: string[],
    bonus: number,
    penalty = 0
): number {
    if (selected.length === 0) return 0;
    return selected.some((s) => menuTags.includes(s)) ? bonus : penalty;
}

/**
 * 비율 기반 매칭 - 매칭 개수에 비례한 점수
 */
function scoreProportionalMatch(
    selected: string[],
    menuTags: string[],
    pointsPerMatch: number,
    ratioBonus: number,
    noMatchPenalty: number
): number {
    if (selected.length === 0) return 0;
    const matches = selected.filter((s) => menuTags.includes(s)).length;
    if (matches === 0) return noMatchPenalty;
    const ratio = matches / selected.length;
    return matches * pointsPerMatch + Math.round(ratio * ratioBonus);
}

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
            if (Array.isArray(value)) {
                return value.some((v) => sel.includes(v));
            }
            return sel.includes(value as string);
        }
        return sel === value;
    });
}

/**
 * 9단계 선택을 기반으로 메뉴를 추천합니다.
 *
 * v3 알고리즘:
 * 1. 하드 필터: cuisine, dishType, cookingMethod 불일치 항목 제거
 * 2. 다층 가중치 스코어링 (균형 재조정):
 *    - 조리법(cookingMethod) 매칭 — 높은 가중치
 *    - 기본 태그 매칭 (시간, 동행, 맛, 온도, 예산)
 *    - 식감(texture) 직접 매칭 (사용자 질문 반영)
 *    - 포만감(satiety) 적합도
 *    - 시간대별 요리 스타일 친화도
 *    - 시너지 보너스 (조합 효과)
 *    - 날씨 컨텍스트 연동
 * 3. 다양성 보장: 후보 풀 확대 + 완화된 가중 랜덤
 * 4. alternatives는 다른 cuisine/dishType에서 선택
 */
export function recommendMenu(
    selections: Selections,
    excludeIds: string[] = [],
    weatherTemp?: number | null
): { recommended: MenuItem | null; alternatives: MenuItem[] } {
    let db = menuDatabase.filter((m) => !excludeIds.includes(m.id));

    // === Step 0: 하드 필터 ===
    if (selections.cuisine.length > 0 && !selections.cuisine.includes("상관없음")) {
        const filtered = db.filter((m) => selections.cuisine.some(c => m.tags.cuisine.includes(c)));
        if (filtered.length >= 3) db = filtered;
    }
    if (selections.dishType.length > 0 && !selections.dishType.includes("상관없음")) {
        const filtered = db.filter((m) => selections.dishType.some(d => m.tags.dishType.includes(d)));
        if (filtered.length >= 2) db = filtered;
    }
    // cookingMethod 하드 필터 — 상관없음 태그가 있는 메뉴는 통과시키되, 스코어링에서 패널티 부여
    if (selections.cookingMethod.length > 0 && !selections.cookingMethod.includes("상관없음")) {
        const filtered = db.filter((m) =>
            m.tags.cookingMethod.includes("상관없음") ||
            selections.cookingMethod.some(cm => m.tags.cookingMethod.includes(cm))
        );
        if (filtered.length >= 2) db = filtered;
    }

    // === Step 1: 다층 스코어링 (v3 균형 재조정) ===
    const scored: ScoredMenu[] = db.map((menu) => {
        let score = 0;
        const breakdown: Record<string, number> = {};

        // --- 1a. 시간대 매칭 (핵심) ---
        if (selections.mealTime.length > 0) {
            if (selections.mealTime.some(t => menu.tags.mealTime.includes(t))) {
                score += 25;
                breakdown["mealTime"] = 25;
            } else {
                score -= 100; // 시간대 불일치는 치명적
                breakdown["mealTime"] = -100;
            }
        }

        // --- 1b. 동행 인원 매칭 ---
        if (selections.companion.length > 0) {
            const s = scoreTagMatch(selections.companion, menu.tags.companion, 15, -10);
            score += s;
            breakdown["companion"] = s;
        }

        // --- 1c. 조리법(cookingMethod) 매칭 — v3 핵심 추가 ---
        if (selections.cookingMethod.length > 0 && !selections.cookingMethod.includes("상관없음")) {
            if (menu.tags.cookingMethod.includes("상관없음")) {
                // 메뉴가 '상관없음'으로 설정된 경우 — 약한 패널티 (정확한 태그 메뉴 우선)
                score -= 8;
                breakdown["cookingMethod"] = -8;
            } else if (selections.cookingMethod.some(cm => menu.tags.cookingMethod.includes(cm))) {
                // 정확히 매칭
                score += 30;
                breakdown["cookingMethod"] = 30;
            } else {
                // 불일치
                score -= 25;
                breakdown["cookingMethod"] = -25;
            }
        }

        // --- 1d. 맛 선호 매칭 (비율 기반, 가중치 하향) ---
        if (selections.taste.length > 0) {
            const tasteScore = scoreProportionalMatch(
                selections.taste, menu.tags.taste, 12, 8, -15
            );
            score += tasteScore;
            breakdown["taste"] = tasteScore;

            // [초고강도 필터] 담백함을 원하고 매운맛을 원하지 않는데 매운 음식(spicyLevel >= 2)이 나온 경우
            const wantsMild = selections.taste.includes("담백");
            const wantsSpicy = selections.taste.includes("매콤") || selections.taste.includes("얼얼");
            if (wantsMild && !wantsSpicy && menu.spicyLevel >= 2) {
                score -= 100;
                breakdown["taste_spice_mismatch"] = -100;
            }
        }

        // --- 1e. 온도 선호 매칭 ---
        if (selections.temperature.length > 0 && !selections.temperature.includes("상온")) {
            const hasMatch = selections.temperature.some(t => menu.tags.temperature.includes(t)) || menu.tags.temperature.includes("상온");
            if (hasMatch) {
                const s = scoreTagMatch(selections.temperature, menu.tags.temperature, 20, 0);
                score += s;
                breakdown["temperature"] = s;
            } else {
                // [초고강도 필터] 차가운 것을 원하는데 뜨거운 것만 있는 등 완전 불일치 시
                score -= 100;
                breakdown["temperature_mismatch"] = -100;
            }
        }

        // --- 1f. 가격대 매칭 ---
        if (selections.budget.length > 0 && !selections.budget.includes("상관없음")) {
            const hasMatch = selections.budget.some(b => menu.tags.budget.includes(b));
            if (hasMatch) {
                const s = scoreTagMatch(selections.budget, menu.tags.budget, 10, 0);
                score += s;
                breakdown["budget"] = s;
            } else {
                // [초고강도 필터] 예산(가성비)을 선택했는데 교집합이 전혀 없는 경우 (플렉스만 있는 등)
                score -= 100;
                breakdown["budget_mismatch"] = -100;
            }
        }

        // --- 1g. 특수 상황 매칭 (보너스 Only, 패널티 없음) ---
        if (selections.context.length > 0 && !selections.context.includes("패스")) {
            const contextMatches = selections.context.filter(c => menu.tags.context.includes(c)).length;
            if (contextMatches > 0) {
                const contextScore = contextMatches * 15;
                score += contextScore;
                breakdown["context"] = contextScore;
            }
        }

        // --- 1h. 식감(texture) 직접 매칭 (v3: 사용자 질문에서 직접 받음) ---
        if (selections.texture && selections.texture.length > 0 && !selections.texture.includes("상관없음")) {
            const texScore = scoreProportionalMatch(
                selections.texture, menu.tags.texture, 10, 5, -10
            );
            score += texScore;
            breakdown["texture_direct"] = texScore;
        } else if (selections.taste.length > 0) {
            // texture 미선택 시 taste 기반 추론 (이전 로직, 가중치 낮게)
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
                const texScore = textureMatches * 3;
                score += texScore;
                breakdown["texture_inferred"] = texScore;
            }
        }

        // --- 1i. 포만감 적합도 (시간대 기반) ---
        if (selections.mealTime.length > 0) {
            const mTime = selections.mealTime[0];
            if (SATIETY_PREFERENCE[mTime]) {
                const preferred = SATIETY_PREFERENCE[mTime];
                if (preferred.includes(menu.tags.satiety)) {
                    score += 8;
                    breakdown["satiety"] = 8;
                } else if (
                    (mTime === "야식" && menu.tags.satiety === "배터짐") ||
                    (mTime === "아침" && menu.tags.satiety === "배터짐") ||
                    (mTime === "간식" && (menu.tags.satiety === "든든함" || menu.tags.satiety === "배터짐"))
                ) {
                    score -= 5;
                    breakdown["satiety"] = -5;
                }
            }
        }

        // --- 1j. 시간대별 요리 스타일 친화도 ---
        if (selections.mealTime.length > 0) {
            for (const mTime of selections.mealTime) {
                if (MEALTIME_DISHTYPE_AFFINITY[mTime]) {
                    const affinityMap = MEALTIME_DISHTYPE_AFFINITY[mTime];
                    for (const dt of menu.tags.dishType) {
                        if (affinityMap[dt] !== undefined) {
                            score += affinityMap[dt];
                            breakdown[`dishTimeAffinity:${mTime}`] = (breakdown[`dishTimeAffinity:${mTime}`] || 0) + affinityMap[dt];
                        }
                    }
                }
            }
        }

        // --- 1k. 시너지 보너스 ---
        for (const rule of SYNERGY_RULES) {
            if (checkSynergyCondition(rule.conditions, selections)) {
                if (rule.label === "다이어트=저칼") {
                    if (menu.calories === "저칼로리") {
                        score += rule.bonus.points;
                        breakdown[`synergy:${rule.label}`] = rule.bonus.points;
                    } else if (menu.calories === "고칼로리") {
                        // [초고강도 필터] 다이어트 중인데 고칼로리 음식인 경우
                        score -= 100;
                        breakdown[`synergy:anti-diet_mismatch`] = -100;
                    }
                } else {
                    const menuTags = menu.tags[rule.bonus.category as keyof MenuItem["tags"]];
                    if (Array.isArray(menuTags) && menuTags.includes(rule.bonus.tag)) {
                        score += rule.bonus.points;
                        breakdown[`synergy:${rule.label}`] = rule.bonus.points;
                    }
                }
            }
        }

        // --- 1l. 날씨 온도 연동 ---
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

    // === Step 3: 후보 선정 + 다양성 보장 (v3: 풀 확대) ===
    const positives = scored.filter((s) => s.score > 0);
    const candidates = positives.length >= 5
        ? positives.slice(0, 15) // 후보 풀 15개로 확대
        : positives.length >= 3
            ? positives.slice(0, 10)
            : scored.slice(0, 8); // fallback

    if (candidates.length === 0) {
        return { recommended: null, alternatives: [] };
    }

    // 가중 랜덤 선택 (v3: 편향 완화로 다양성 강화)
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
 * 가중 랜덤 선택 — v3: 편향 완화 (지수 1.3, 최소 가중치 0.1)
 */
function weightedRandomPick(candidates: ScoredMenu[]): MenuItem {
    if (candidates.length === 0) return menuDatabase[0];
    if (candidates.length === 1) return candidates[0].menu;

    const topScore = candidates[0].score;
    const minScore = Math.max(candidates[candidates.length - 1].score, 1);

    // 점수를 0~1로 정규화 후 지수 1.3으로 완화된 상위 편향
    const weights = candidates.map((c) => {
        const normalized = (c.score - minScore + 1) / (topScore - minScore + 1);
        return Math.pow(normalized, 1.3) + 0.1; // 0.1 최소 가중치로 더 넓은 변동성
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
 * 추천 이유 문구 생성 (v3: 더 다양한 이유 조합)
 */
export function getRecommendReason(
    menu: MenuItem,
    selections: Selections
): string {
    const reasons: string[] = [];

    // 1. 특수 상황 매칭
    if (selections.context.length > 0 && !selections.context.includes("패스")) {
        const matchedContext = selections.context.find((c) => menu.tags.context.includes(c));
        if (matchedContext) {
            const contextMap: Record<string, string> = {
                "해장": "속이 풀리는 해장 메뉴로 딱이에요!",
                "다이어트": "가볍고 건강하게 즐길 수 있어요!",
                "컨디션": "몸이 안 좋을 때 부담 없이 먹기 좋아요.",
                "비": "비 오는 날 분위기와 찰떡이에요!",
                "더운날": "더운 날씨에 딱 맞는 선택이에요!",
                "추운날": "추운 날 몸을 따뜻하게 녹여줄 거예요.",
                "우울해": "꿀꿀한 기분을 달래줄 소울푸드예요.",
                "월급날": "플렉스하기 딱 좋은 럭셔리 메뉴!",
                "넷플릭스": "화면 보며 가볍게 즐기기 편해요.",
                "기분좋은날": "좋은 날엔 맛있는 걸로 기분 UP!",
                "시간없어": "빠르게 든든하게 해결할 수 있어요!",
            };
            if (contextMap[matchedContext]) reasons.push(contextMap[matchedContext]);
        }
    }

    // 2. 조리법 매칭
    if (selections.cookingMethod.length > 0 && !selections.cookingMethod.includes("상관없음")) {
        const matchedCM = selections.cookingMethod.find((cm) => menu.tags.cookingMethod.includes(cm));
        if (matchedCM) {
            const cmMap: Record<string, string> = {
                "국물": "따끈한 국물이 속을 달래줄 거예요.",
                "구이볶음": "불맛 가득한 요리로 입맛을 사로잡아요!",
                "튀김": "바삭한 튀김이 기분까지 바삭하게!",
                "찜삶음": "부드럽고 촉촉한 맛이 일품이에요.",
                "날것": "신선한 재료 본연의 맛을 즐겨보세요!",
            };
            if (cmMap[matchedCM] && reasons.length < 2) reasons.push(cmMap[matchedCM]);
        }
    }

    // 3. 맛 매칭
    if (selections.taste.length > 0) {
        const matched = selections.taste.filter((t) => menu.tags.taste.includes(t));
        if (matched.length > 0 && reasons.length < 2) {
            reasons.push(`${matched.join(" + ")} 맛을 좋아하신다면 강력 추천!`);
        }
    }

    // 4. 동행 매칭
    if (selections.companion.length > 0) {
        const matchedComp = selections.companion.find((c) => menu.tags.companion.includes(c));
        if (matchedComp && reasons.length < 2) {
            const compMap: Record<string, string> = {
                "혼밥": "혼자서도 편하게 즐기기 좋아요.",
                "연인": "데이트 메뉴로 분위기 있는 선택!",
                "친구": "친구들과 나눠 먹으면 더 맛있어요!",
                "가족": "온 가족이 함께 즐기기 좋은 메뉴예요.",
                "회식": "다 같이 먹으면 분위기 최고!",
            };
            if (compMap[matchedComp]) {
                reasons.push(compMap[matchedComp]);
            }
        }
    }

    // 5. 식감 하이라이트
    if (menu.tags.texture.length > 0 && reasons.length < 2) {
        const textureDesc: Record<string, string> = {
            "바삭": "바삭한 식감이 매력적이에요!",
            "쫄깃": "쫄깃한 식감이 일품이에요!",
            "부드러움": "부드럽게 넘어가는 맛이 좋아요.",
            "아삭": "아삭한 채소가 식감을 더해요!",
            "꾸덕": "꾸덕한 식감이 중독적이에요!",
            "탱글": "탱글탱글한 식감이 매력 포인트!",
            "촉촉": "촉촉하고 풍미 가득한 맛이에요.",
        };
        const texMatch = menu.tags.texture.find((t) => textureDesc[t]);
        if (texMatch) {
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

    const t = temp ?? 20;
    const c = condition.toLowerCase();

    const getRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

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

    return getRandom([
        "선선한 날씨엔 든든한 덮밥이나 가정식 백반 어때요? 🍚",
        "오늘 같은 날씨엔 치킨에 맥주가 딱! 🍗",
        "특별한 날, 초밥으로 깔끔한 한 끼! 🍣",
        "맛있는 한 끼로 오늘 하루 힘내세요! 💪"
    ]);
}
