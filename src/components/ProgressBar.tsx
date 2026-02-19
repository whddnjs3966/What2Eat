"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
    currentStep: number;
    totalSteps: number;
}

export default function ProgressBar({
    currentStep,
    totalSteps,
}: ProgressBarProps) {
    const progress = ((currentStep + 1) / totalSteps) * 100;

    return (
        <div className="w-full max-w-md mx-auto">
            {/* 단계 표시 */}
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-white/50 font-medium">
                    Step {currentStep + 1} / {totalSteps}
                </span>
                <span className="text-xs text-white/50 font-medium">
                    {Math.round(progress)}%
                </span>
            </div>

            {/* 프로그레스 바 */}
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                />
            </div>
        </div>
    );
}
