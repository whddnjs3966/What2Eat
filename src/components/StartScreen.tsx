"use client";

import { motion } from "framer-motion";
import { Utensils, Play } from "lucide-react";
import { getWeatherRecommendation } from "@/lib/recommend";

interface StartScreenProps {
    weather: {
        temp: number | null;
        condition: string | null;
        loaded: boolean;
    };
    onStart: () => void;
}

export default function StartScreen({ weather, onStart }: StartScreenProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-10 relative z-10"
        >
            <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="relative"
            >
                <div className="absolute inset-0 bg-violet-500 blur-2xl opacity-30 animate-pulse" />
                <Utensils size={80} className="text-white relative z-10 drop-shadow-xl" aria-hidden="true" />
            </motion.div>

            <div className="space-y-4">
                <motion.h1
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-4xl font-black tracking-tight"
                >
                    <span className="block text-violet-300 text-2xl mb-2">결정장애 해결사</span>
                    <span className="bg-gradient-to-r from-violet-200 via-white to-fuchsia-200 bg-clip-text text-transparent">
                        오늘 메뉴
                    </span>
                </motion.h1>

                {weather.loaded && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="py-2 px-4 rounded-full bg-white/10 border border-white/10 inline-block max-w-[90vw]"
                    >
                        <p className="text-violet-200 text-xs sm:text-sm font-medium text-center leading-snug px-1">
                            {getWeatherRecommendation(weather.temp, weather.condition)}
                        </p>
                    </motion.div>
                )}

                <p className="text-white/60 text-lg leading-relaxed">
                    8가지 취향 질문으로<br />
                    오늘의 완벽한 한 끼를<br />
                    찾아드립니다.
                </p>
            </div>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onStart}
                aria-label="메뉴 추천 시작하기"
                className="w-full bg-white text-violet-900 font-bold text-xl py-4 rounded-3xl shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center justify-center gap-2 hover:bg-violet-50 transition-colors mt-8"
            >
                <Play fill="currentColor" size={24} aria-hidden="true" />
                시작하기
            </motion.button>
        </motion.div>
    );
}
