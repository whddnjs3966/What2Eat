import { create } from "zustand";
import { MenuItem } from "@/data/menuDatabase";

export interface Selections {
    mealTime: string[];
    companion: string[];
    cuisine: string[];
    cookingMethod: string[];
    taste: string[];
    dishType: string[];
    temperature: string[];
    budget: string[];
    context: string[];
}

interface AppState {
    // 현재 단계 (0-indexed, 8단계)
    currentStep: number;

    // 사용자 선택
    selections: Selections;

    // 추천 결과
    recommendedMenu: MenuItem | null;

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
    setShowResult: (show: boolean) => void;
    setIsAnimating: (animating: boolean) => void;
    setWeather: (temp: number, condition: string) => void;
    reset: () => void;
}

const initialSelections: Selections = {
    mealTime: [],
    companion: [],
    cuisine: [],
    cookingMethod: [],
    taste: [],
    dishType: [],
    temperature: [],
    budget: [],
    context: [],
};

export const useAppStore = create<AppState>((set) => ({
    currentStep: 0,
    selections: { ...initialSelections },
    recommendedMenu: null,
    showResult: false,
    isAnimating: false,
    weather: { temp: null, condition: null, loaded: false },

    setStep: (step) => set({ currentStep: step }),

    nextStep: () =>
        set((state) => ({
            currentStep: Math.min(state.currentStep + 1, 8),
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
    setShowResult: (show) => set({ showResult: show }),
    setIsAnimating: (animating) => set({ isAnimating: animating }),

    setWeather: (temp, condition) =>
        set({ weather: { temp, condition, loaded: true } }),

    reset: () =>
        set({
            currentStep: 0,
            selections: { ...initialSelections },
            recommendedMenu: null,
            showResult: false,
            isAnimating: false,
        }),
}));
