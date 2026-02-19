// 추천 알고리즘 — 필터링 + 가중치 스코어링
import { MenuItem, menuDatabase } from "@/data/menuDatabase";
import { Selections } from "@/store/useAppStore";

interface ScoredMenu {
    menu: MenuItem;
    score: number;
}

/**
 * 8단계 선택을 기반으로 메뉴를 추천합니다.
 * 1. 필터링: 선택한 조건에 맞는 메뉴만 남김
 * 2. 가중치 스코어링: 조건에 더 많이 매칭될수록 높은 점수
 * 3. 상위 후보 중 랜덤 선택
 */
export function recommendMenu(
    selections: Selections,
    excludeIds: string[] = []
): { recommended: MenuItem | null; alternatives: MenuItem[] } {
    const db = menuDatabase.filter((m) => !excludeIds.includes(m.id));

    // Step 1: 태그 매칭 스코어 계산
    const scored: ScoredMenu[] = db.map((menu) => {
        let score = 0;

        // 시간대 매칭 (필수, 높은 가중치)
        if (selections.mealTime) {
            if (menu.tags.mealTime.includes(selections.mealTime)) {
                score += 30;
            } else {
                score -= 50; // 시간대 불일치 패널티
            }
        }

        // 동행 인원 매칭
        if (selections.companion) {
            if (menu.tags.companion.includes(selections.companion)) {
                score += 20;
            } else {
                score -= 10;
            }
        }

        // 음식 종류 매칭
        if (selections.cuisine && selections.cuisine !== "상관없음") {
            if (menu.tags.cuisine.includes(selections.cuisine)) {
                score += 25;
            } else {
                score -= 100; // 요리 종류 불일치는 큰 패널티
            }
        }

        // 맛 선호 매칭 (복수 선택)
        if (selections.taste.length > 0) {
            const tasteMatches = selections.taste.filter((t) =>
                menu.tags.taste.includes(t)
            ).length;
            score += tasteMatches * 15;
            if (tasteMatches === 0) score -= 10;
        }

        // 음식 형태 매칭
        if (selections.dishType && selections.dishType !== "상관없음") {
            if (menu.tags.dishType.includes(selections.dishType)) {
                score += 20;
            } else {
                score -= 30;
            }
        }

        // 온도 선호 매칭
        if (selections.temperature && selections.temperature !== "상온") {
            if (menu.tags.temperature.includes(selections.temperature)) {
                score += 10;
            } else {
                score -= 15;
            }
        }

        // 가격대 매칭
        if (selections.budget && selections.budget !== "상관없음") {
            if (menu.tags.budget.includes(selections.budget)) {
                score += 10;
            } else {
                score -= 5;
            }
        }

        // 특수 상황 매칭 (보너스)
        if (selections.context && selections.context !== "패스") {
            if (menu.tags.context.includes(selections.context)) {
                score += 25; // 상황 매칭 보너스
            }
        }

        return { menu, score };
    });

    // Step 2: 점수 기준 정렬
    scored.sort((a, b) => b.score - a.score);

    // Step 3: 상위 5개 후보
    const candidates = scored.filter((s) => s.score > 0).slice(0, 5);

    if (candidates.length === 0) {
        // 모든 조건에 맞는 게 없으면 전체에서 상위 3개
        const fallback = scored.slice(0, 3);
        if (fallback.length === 0) return { recommended: null, alternatives: [] };

        const randomIndex = Math.floor(Math.random() * Math.min(fallback.length, 3));
        const recommended = fallback[randomIndex].menu;
        const alternatives = fallback
            .filter((s) => s.menu.id !== recommended.id)
            .slice(0, 2)
            .map((s) => s.menu);

        return { recommended, alternatives };
    }

    // 상위 후보 중 가중 랜덤 선택
    const totalScore = candidates.reduce((sum, c) => sum + c.score, 0);
    let random = Math.random() * totalScore;
    let recommended = candidates[0].menu;

    for (const c of candidates) {
        random -= c.score;
        if (random <= 0) {
            recommended = c.menu;
            break;
        }
    }

    const alternatives = candidates
        .filter((c) => c.menu.id !== recommended.id)
        .slice(0, 2)
        .map((c) => c.menu);

    return { recommended, alternatives };
}

/**
 * 날씨 기반 가중치 조정을 위한 상황 매핑
 */
export function getWeatherContext(
    temp: number | null,
    condition: string | null
): string | null {
    if (condition && (condition.includes("rain") || condition.includes("drizzle"))) {
        return "비";
    }
    if (temp !== null) {
        if (temp >= 30) return "더운날";
        if (temp <= 5) return "추운날";
    }
    return null;
}

/**
 * 추천 이유 문구 생성
 */
export function getRecommendReason(
    menu: MenuItem,
    selections: Selections
): string {
    const reasons: string[] = [];
    // ... reasons logic
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
