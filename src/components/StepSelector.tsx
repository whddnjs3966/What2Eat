"use client";

import { motion, AnimatePresence } from "framer-motion";
import { StepOption } from "@/data/stepsConfig";
import { Check } from "lucide-react";

interface StepSelectorProps {
    options: StepOption[];
    selected: string | string[] | null;
    multiSelect?: boolean;
    onSelect: (id: string) => void;
}

export default function StepSelector({
    options,
    selected,
    multiSelect = false,
    onSelect,
}: StepSelectorProps) {
    const isSelected = (id: string): boolean => {
        if (multiSelect && Array.isArray(selected)) {
            return selected.includes(id);
        }
        return selected === id;
    };

    return (
        <div className="grid grid-cols-2 gap-3 w-full px-2 pb-4">
            <AnimatePresence mode="popLayout">
                {options.map((option, index) => (
                    <motion.button
                        key={option.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            transition: { delay: index * 0.05 }
                        }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onSelect(option.id)}
                        className={`
              relative flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300
              ${isSelected(option.id)
                                ? "bg-violet-500/30 border-violet-400 shadow-[0_0_15px_rgba(167,139,250,0.3)]"
                                : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                            }
            `}
                    >
                        {/* 선택 표시 */}
                        {isSelected(option.id) && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute top-2 right-2 w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center"
                            >
                                <Check size={14} className="text-white" />
                            </motion.div>
                        )}

                        {/* 이모지 */}
                        {/* 아이콘 (이미지 또는 이모지) */}
                        {option.iconUrl ? (
                            <div className="mb-2 rounded-md overflow-hidden shadow-sm">
                                <img
                                    src={option.iconUrl}
                                    alt={option.label}
                                    className="w-10 h-7 object-cover"
                                />
                            </div>
                        ) : (
                            <span className="text-3xl md:text-4xl">{option.emoji}</span>
                        )}

                        {/* 라벨 */}
                        <span
                            className={`text-sm md:text-base font-semibold text-center leading-tight ${isSelected(option.id) ? "text-violet-200" : "text-white/90"
                                }`}
                        >
                            {option.label}
                        </span>

                        {/* 설명 */}
                        {option.description && (
                            <span className="text-[11px] md:text-xs text-white/40 text-center leading-tight">
                                {option.description}
                            </span>
                        )}
                    </motion.button>
                ))}
            </AnimatePresence>
        </div>
    );
}
