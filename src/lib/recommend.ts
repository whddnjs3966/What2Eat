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

    if (selections.context === "비") {
        reasons.push("비 오는 날엔 이게 최고!");
    } else if (selections.context === "해장") {
        reasons.push("속이 확 풀리는 해장 메뉴!");
    } else if (selections.context === "다이어트") {
        reasons.push("가볍게 먹기 딱 좋아요!");
    } else if (selections.context === "추운날") {
        reasons.push("추운 날, 따뜻하게 속을 녹여줄 한 그릇!");
    } else if (selections.context === "더운날") {
        reasons.push("더운 날엔 시원하게!");
    } else if (selections.context === "기분좋은날") {
        reasons.push("기분 좋은 날엔 맛있는 걸로!");
    } else if (selections.context === "시간없어") {
        reasons.push("빠르게 먹기 딱 좋아요!");
    } else if (selections.context === "컨디션") {
        reasons.push("몸에 좋은 따끈한 한 그릇!");
    }

    if (selections.companion === "혼밥") {
        reasons.push("혼자서도 충분히 행복한 메뉴");
    } else if (selections.companion === "연인") {
        reasons.push("분위기 있는 식사에 딱!");
    } else if (selections.companion === "회식") {
        reasons.push("모두가 만족할 메뉴!");
    }

    if (reasons.length === 0) {
        reasons.push(menu.description);
    }

    return reasons[0];
}
