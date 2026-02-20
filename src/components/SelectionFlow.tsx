"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { StepConfig } from "@/data/stepsConfig";
import { Selections } from "@/store/useAppStore";
import StepSelector from "./StepSelector";
import ProgressBar from "./ProgressBar";

interface SelectionFlowProps {
    currentStep: number;
    totalSteps: number;
    currentConfig: StepConfig;
    selections: Selections;
    onSelect: (optionId: string) => void;
    onNext: () => void;
    onPrev: () => void;
    onSkip: () => void;
    onReset: () => void;
}

export default function SelectionFlow({
    currentStep,
    totalSteps,
    currentConfig,
    selections,
    onSelect,
    onNext,
    onPrev,
    onSkip,
    onReset,
}: SelectionFlowProps) {
    return (
        <>
            {/* Header */}
            <div className="pt-12 px-6 pb-4 flex items-center justify-between z-10">
                <button
                    onClick={onReset}
                    aria-label="처음으로 돌아가기"
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                >
                    <RotateCcw size={18} className="text-white/70" aria-hidden="true" />
                </button>
                <div className="text-sm font-bold text-white/40" aria-live="polite" aria-label={`${currentStep + 1}단계 / 총 ${totalSteps}단계`}>
                    {currentStep + 1} / {totalSteps}
                </div>
            </div>

            {/* Progress */}
            <div className="px-6 mb-6 z-10">
                <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
            </div>

            {/* Question Area */}
            <div className="flex-1 overflow-y-auto scrollbar-hide z-10 pb-24">
                <div className="px-6 space-y-2 mb-6 text-center">
                    <motion.h2
                        key={`t-${currentStep}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-2xl font-bold text-white shadow-black drop-shadow-lg"
                    >
                        {currentConfig.title}
                    </motion.h2>
                    <motion.p
                        key={`s-${currentStep}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-white/60 text-sm"
                    >
                        {currentConfig.subtitle}
                    </motion.p>
                </div>

                <StepSelector
                    options={currentConfig.options}
                    selected={selections[currentConfig.id as keyof typeof selections] as string[]}
                    multiSelect={currentConfig.multiSelect}
                    onSelect={onSelect}
                />
            </div>

            {/* Bottom Navigation (Fixed) */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent z-20 flex items-center gap-3">
                {currentStep > 0 && (
                    <button
                        onClick={onPrev}
                        aria-label="이전 단계로"
                        className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                    >
                        <ArrowLeft size={20} aria-hidden="true" />
                    </button>
                )}

                {currentConfig.optional && (
                    <button
                        onClick={onSkip}
                        aria-label="이 단계 건너뛰기"
                        className="flex-1 bg-white/10 h-12 rounded-2xl font-medium text-white/80 hover:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                    >
                        건너뛰기
                    </button>
                )}

                {(currentConfig.multiSelect || currentStep === totalSteps - 1) && (
                    <button
                        onClick={onNext}
                        aria-label={currentStep === totalSteps - 1 ? "결과 보기" : "다음 단계로"}
                        className="flex-1 bg-violet-600 h-12 rounded-2xl font-bold text-white shadow-lg shadow-violet-500/30 hover:bg-violet-500 transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
                    >
                        {currentStep === totalSteps - 1 ? "결과 보기" : "다음"}
                        {currentStep < totalSteps - 1 && (
                            <ArrowRight size={18} aria-hidden="true" />
                        )}
                    </button>
                )}
            </div>
        </>
    );
}
