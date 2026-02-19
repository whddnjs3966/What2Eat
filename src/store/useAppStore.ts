import { create } from "zustand";
import { MenuItem } from "@/data/menuDatabase";

export interface Selections {
    mealTime: string | null;
    companion: string | null;
    cuisine: string | null;
    taste: string[];
    dishType: string | null;
    temperature: string | null;
    budget: string | null;
    context: string | null;
}

interface AppState {
    // 현재 단계 (0-indexed, 8단계)
    currentStep: number;

    // 사용자 선택
    selections: Selections;

    // 추천 결과
    recommendedMenu: MenuItem | null;
    alternativeMenus: MenuItem[];

    // 결과 페이지 표시
    showResult: boolean;
    isAnimating: boolean;

    // 날씨 데이터
    weather: {
        temp: number | null;
        condition: string | null;
        loaded: boolean;
    };

    // 액션
    setStep: (step: number) => void;
    nextStep: () => void;
    prevStep: () => void;
    setSelection: (stepId: string, value: string | string[]) => void;
    setRecommendedMenu: (menu: MenuItem) => void;
    setAlternativeMenus: (menus: MenuItem[]) => void;
    setShowResult: (show: boolean) => void;
    setIsAnimating: (animating: boolean) => void;
    setWeather: (temp: number, condition: string) => void;
    reset: () => void;
}

const initialSelections: Selections = {
    mealTime: null,
    companion: null,
    cuisine: null,
    taste: [],
    dishType: null,
    temperature: null,
    budget: null,
    context: null,
};

export const useAppStore = create<AppState>((set) => ({
    currentStep: 0,
    selections: { ...initialSelections },
    recommendedMenu: null,
    alternativeMenus: [],
    showResult: false,
    isAnimating: false,
    weather: { temp: null, condition: null, loaded: false },

    setStep: (step) => set({ currentStep: step }),

    nextStep: () =>
        set((state) => ({
            currentStep: Math.min(state.currentStep + 1, 7),
        })),

    prevStep: () =>
        set((state) => ({
            currentStep: Math.max(state.currentStep - 1, 0),
        })),

    setSelection: (stepId, value) =>
        set((state) => ({
            selections: {
                ...state.selections,
                [stepId]: value,
            },
        })),

    setRecommendedMenu: (menu) => set({ recommendedMenu: menu }),
    setAlternativeMenus: (menus) => set({ alternativeMenus: menus }),
    setShowResult: (show) => set({ showResult: show }),
    setIsAnimating: (animating) => set({ isAnimating: animating }),

    setWeather: (temp, condition) =>
        set({ weather: { temp, condition, loaded: true } }),

    reset: () =>
        set({
            currentStep: 0,
            selections: { ...initialSelections },
            recommendedMenu: null,
            alternativeMenus: [],
            showResult: false,
            isAnimating: false,
        }),
}));
