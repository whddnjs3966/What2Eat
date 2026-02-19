"use client";

import { motion } from "framer-motion";
import { MenuItem } from "@/data/menuDatabase";
import { MapPin, RefreshCw, Share2, Bookmark, ExternalLink } from "lucide-react";

interface ResultCardProps {
    menu: MenuItem;
    reason: string;
    onRetry: () => void;
    onShare: () => void;
    onMap: () => void;
}

export default function ResultCard({
    menu,
    reason,
    onRetry,
    onShare,
    onMap,
}: ResultCardProps) {
    const spicyDots = Array.from({ length: 3 }, (_, i) => i < menu.spicyLevel);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.3 }}
            className="w-full max-w-sm mx-auto"
        >
            <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
                {/* 음식 이미지 영역 - 그라디언트 placeholder */}
                {/* 음식 이미지 영역 */}
                <div className="relative h-56 md:h-64 bg-zinc-900 group overflow-hidden">
                    <img
                        src={`https://image.pollinations.ai/prompt/delicious%20${encodeURIComponent(menu.nameEn)}%20dish%20professional%20food%20photography,%204k,%20highly%20detailed?width=800&height=600&nologo=true&seed=${menu.id}`}
                        alt={menu.name}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                    />
                    {/* 상단 그라디언트 (텍스트 가독성용) */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />

                    {/* 가격 배지 */}
                    <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 z-10">
                        <span className="text-xs text-white/90 font-medium">
                            {menu.priceRange}
                        </span>
                    </div>
                </div>

                {/* 정보 영역 */}
                <div className="p-5 md:p-6 space-y-4">
                    {/* 제목 */}
                    <div>
                        <motion.h2
                            className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 }}
                        >
                            <span className="text-3xl md:text-4xl">{menu.emoji}</span>
                            {menu.name}
                        </motion.h2>
                        <motion.p
                            className="text-sm text-white/40 mt-1"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7 }}
                        >
                            {menu.nameEn}
                        </motion.p>
                    </div>

                    {/* 추천 이유 */}
                    <motion.div
                        className="px-4 py-3 bg-violet-500/10 border border-violet-500/20 rounded-xl"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                    >
                        <p className="text-sm text-violet-200 leading-relaxed">
                            &ldquo;{reason}&rdquo;
                        </p>
                    </motion.div>

                    {/* 메타 태그 */}
                    <motion.div
                        className="flex flex-wrap gap-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9 }}
                    >
                        {/* 매움 레벨 */}
                        <div className="flex items-center gap-1 px-2.5 py-1 bg-white/5 rounded-lg border border-white/10">
                            <span className="text-xs text-white/60">매움</span>
                            <div className="flex gap-0.5">
                                {spicyDots.map((active, i) => (
                                    <span
                                        key={i}
                                        className={`w-2 h-2 rounded-full ${active ? "bg-red-400" : "bg-white/20"
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* 소요시간 */}
                        <div className="px-2.5 py-1 bg-white/5 rounded-lg border border-white/10">
                            <span className="text-xs text-white/60">⏱ {menu.cookTime}</span>
                        </div>

                        {/* 칼로리 */}
                        <div className="px-2.5 py-1 bg-white/5 rounded-lg border border-white/10">
                            <span className="text-xs text-white/60">🔥 {menu.calories}</span>
                        </div>

                        {/* 온도 */}
                        {menu.tags.temperature.map((temp) => (
                            <div
                                key={temp}
                                className="px-2.5 py-1 bg-white/5 rounded-lg border border-white/10"
                            >
                                <span className="text-xs text-white/60">
                                    {temp === "뜨거운" ? "🔥" : temp === "차가운" ? "❄️" : "🌡️"}{" "}
                                    {temp}
                                </span>
                            </div>
                        ))}
                    </motion.div>

                    {/* CTA 버튼 */}
                    <motion.div
                        className="space-y-2.5 pt-2"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.0 }}
                    >
                        {/* 내 주변 식당 보기 (프라이머리) */}
                        <button
                            onClick={onMap}
                            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl
                bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500
                text-white font-semibold text-sm transition-all duration-300
                shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40
                active:scale-[0.98]"
                        >
                            <MapPin size={18} />
                            내 주변 {menu.name} 식당 보기
                            <ExternalLink size={14} className="opacity-60" />
                        </button>

                        {/* 하단 버튼 그룹 */}
                        <div className="flex gap-2">
                            <button
                                onClick={onRetry}
                                className="flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl
                  bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20
                  text-white/70 hover:text-white font-medium text-sm transition-all duration-300
                  active:scale-[0.98]"
                            >
                                <RefreshCw size={16} />
                                다시 추천
                            </button>
                            <button
                                onClick={onShare}
                                className="flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl
                  bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20
                  text-white/70 hover:text-white font-medium text-sm transition-all duration-300
                  active:scale-[0.98]"
                            >
                                <Share2 size={16} />
                                공유하기
                            </button>
                            <button
                                className="flex items-center justify-center py-3 px-3 rounded-xl
                  bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20
                  text-white/70 hover:text-white transition-all duration-300
                  active:scale-[0.98]"
                            >
                                <Bookmark size={16} />
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}
