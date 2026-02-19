"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const slotEmojis = [
    "🍚", "🍜", "🍲", "🥩", "🍕", "🍣", "🍗", "🍛",
    "🌮", "🍔", "🥗", "🍝", "🍙", "🥘", "🌶️", "🍰",
];

interface LoadingAnimationProps {
    onComplete: () => void;
}

export default function LoadingAnimation({ onComplete }: LoadingAnimationProps) {
    const [phase, setPhase] = useState(0); // 0: spinning, 1: slowing, 2: done
    const [currentEmoji, setCurrentEmoji] = useState("🍽️");

    useEffect(() => {
        let emojiInterval: NodeJS.Timeout;
        let timeout1: NodeJS.Timeout;
        let timeout2: NodeJS.Timeout;

        // Phase 0: 빠르게 이모지 변경
        emojiInterval = setInterval(() => {
            setCurrentEmoji(
                slotEmojis[Math.floor(Math.random() * slotEmojis.length)]
            );
        }, 80);

        // Phase 1: 느려지기 (1.5초 후)
        timeout1 = setTimeout(() => {
            setPhase(1);
            clearInterval(emojiInterval);

            // 느리게 변경
            let count = 0;
            const slowInterval = setInterval(() => {
                setCurrentEmoji(
                    slotEmojis[Math.floor(Math.random() * slotEmojis.length)]
                );
                count++;
                if (count >= 5) {
                    clearInterval(slowInterval);
                    setPhase(2);
                }
            }, 300);
        }, 1500);

        // Phase 2: 완료 (3초 후)
        timeout2 = setTimeout(() => {
            onComplete();
        }, 3000);

        return () => {
            clearInterval(emojiInterval);
            clearTimeout(timeout1);
            clearTimeout(timeout2);
        };
    }, [onComplete]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center gap-6 py-20"
        >
            {/* 슬롯머신 이모지 */}
            <motion.div
                className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-white/5 border border-white/10
          backdrop-blur-xl flex items-center justify-center shadow-2xl shadow-violet-500/10"
                animate={{
                    rotate: phase === 0 ? [0, 5, -5, 0] : 0,
                    scale: phase === 2 ? [1, 1.1, 1] : 1,
                }}
                transition={{
                    rotate: { repeat: Infinity, duration: 0.3 },
                    scale: { duration: 0.5 },
                }}
            >
                <AnimatePresence mode="popLayout">
                    <motion.span
                        key={currentEmoji}
                        initial={{ y: -40, opacity: 0, scale: 0.5 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 40, opacity: 0, scale: 0.5 }}
                        transition={{ duration: phase === 0 ? 0.06 : 0.2 }}
                        className="text-6xl md:text-7xl"
                    >
                        {currentEmoji}
                    </motion.span>
                </AnimatePresence>
            </motion.div>

            {/* 텍스트 */}
            <motion.div
                className="text-center space-y-2"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
            >
                <p className="text-lg md:text-xl font-bold text-white">
                    {phase === 0
                        ? "두구두구..."
                        : phase === 1
                            ? "거의 다 됐어요!"
                            : "🎉 찾았다!"}
                </p>
                <p className="text-sm text-white/50">
                    당신에게 딱 맞는 메뉴를 찾고 있어요
                </p>
            </motion.div>

            {/* 이퀄라이저 바 */}
            <div className="flex items-end gap-1">
                {Array.from({ length: 7 }, (_, i) => (
                    <motion.div
                        key={i}
                        className="w-2 rounded-full bg-gradient-to-t from-violet-500 to-fuchsia-400"
                        animate={{
                            height: phase < 2 ? [8, 24 + Math.random() * 16, 8] : [8, 8],
                        }}
                        transition={{
                            repeat: Infinity,
                            duration: 0.4 + i * 0.1,
                            delay: i * 0.05,
                        }}
                    />
                ))}
            </div>
        </motion.div>
    );
}
