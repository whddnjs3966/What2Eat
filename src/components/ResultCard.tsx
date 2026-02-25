"use client";

import { motion } from "framer-motion";
import { MenuItem } from "@/data/menuDatabase";
import { MapPin, RefreshCw, Share2, ExternalLink } from "lucide-react";

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
    const spicyLabel = ["안매움", "약간매움", "보통매움", "아주매움"][menu.spicyLevel] ?? "보통매움";

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.3 }}
            className="w-full mx-auto"
        >
            <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-white/8 shadow-2xl">
                {/* 음식 이모지 히어로 영역 */}
                <div className="relative h-36 sm:h-44 bg-gradient-to-br from-violet-600/40 via-fuchsia-600/30 to-purple-800/40 flex items-center justify-center overflow-hidden">
                    {/* 배경 장식 */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.08)_0%,transparent_60%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(167,139,250,0.15)_0%,transparent_50%)]" />

                    {/* 큰 이모지 */}
                    <motion.span
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.5 }}
                        className="text-7xl sm:text-8xl drop-shadow-lg select-none"
                    >
                        {menu.emoji}
                    </motion.span>

                    {/* Cuisine Badge */}
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/50 border border-white/15">
                        <span className="text-[11px] text-white/90 font-medium">
                            {menu.tags.cuisine.join(", ")}
                        </span>
                    </div>

                    {/* 하단 해시태그 */}
                    <div className="absolute inset-x-0 bottom-0 px-3 pb-2.5 pt-8 bg-gradient-to-t from-black/60 to-transparent">
                        <div className="flex flex-wrap gap-1">
                            {menu.tags.taste.slice(0, 3).map((tag) => (
                                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/15 text-white/90 border border-white/10">
                                    #{tag}
                                </span>
                            ))}
                            {menu.tags.context.slice(0, 2).map((tag) => (
                                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/15 text-white/90 border border-white/10">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 정보 영역 */}
                <div className="p-4 sm:p-6 space-y-4">
                    {/* 제목 + 가격 */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                            {menu.name}
                        </h2>
                        <div className="flex items-center gap-2 mt-1.5 min-w-0">
                            <p className="text-xs sm:text-sm text-white/40 truncate min-w-0 flex-1">{menu.nameEn}</p>
                            <span className="text-xs sm:text-sm font-semibold text-violet-300 shrink-0">{menu.priceRange}</span>
                        </div>
                    </motion.div>

                    {/* 추천 이유 */}
                    <motion.div
                        className="px-2.5 py-2 bg-violet-500/10 border border-violet-500/20 rounded-xl"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                    >
                        <p className="text-xs sm:text-sm text-violet-200 leading-relaxed">
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
                        <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10">
                            <span className="text-xs text-white/50">매움</span>
                            <div className="flex gap-1">
                                {spicyDots.map((active, i) => (
                                    <span
                                        key={i}
                                        className={`w-2.5 h-2.5 rounded-full ${active ? "bg-red-400 shadow-[0_0_5px_rgba(248,113,113,0.6)]" : "bg-white/20"}`}
                                    />
                                ))}
                            </div>
                            <span className="text-xs font-semibold text-white/80">{spicyLabel}</span>
                        </div>

                        <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10">
                            <span className="text-xs text-white/50">조리</span>
                            <span className="text-xs font-semibold text-white/90">{menu.cookTime}</span>
                        </div>

                        <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10">
                            <span className="text-xs text-white/50">칼로리</span>
                            <span className="text-xs font-semibold text-white/90">{menu.calories}</span>
                        </div>

                        <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10">
                            <span className="text-xs text-white/50">포만감</span>
                            <span className="text-xs font-semibold text-violet-300">{menu.tags.satiety}</span>
                        </div>

                        <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10">
                            <span className="text-xs text-white/50">식감</span>
                            <span className="text-xs font-semibold text-white/90">{menu.tags.texture.join(", ")}</span>
                        </div>

                        {menu.tags.temperature.map((temp) => (
                            <div key={temp} className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10">
                                <span className="text-xs text-white/50">온도</span>
                                <span className="text-xs font-semibold text-white/90">
                                    {temp} {temp === "뜨거운" ? "🔥" : temp === "차가운" ? "❄️" : "🌡️"}
                                </span>
                            </div>
                        ))}
                    </motion.div>

                    {/* CTA 버튼 */}
                    <motion.div
                        className="space-y-3 pt-2"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.0 }}
                    >
                        {/* 내 주변 식당 보기 */}
                        <button
                            onClick={onMap}
                            aria-label={`${menu.name} 주변 식당 지도에서 검색`}
                            className="w-full flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl
                bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500
                text-white font-semibold text-xs sm:text-sm transition-all duration-300
                shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40
                active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
                        >
                            <MapPin size={16} className="shrink-0" aria-hidden="true" />
                            <span className="truncate">내 주변 식당 보기</span>
                            <ExternalLink size={14} className="opacity-60 shrink-0" aria-hidden="true" />
                        </button>

                        {/* 하단 버튼 그룹 */}
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={onRetry}
                                aria-label="다른 메뉴 다시 추천받기"
                                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl
                  bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20
                  text-white/70 hover:text-white font-medium text-xs transition-all duration-300
                  active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                            >
                                <RefreshCw size={14} className="shrink-0" aria-hidden="true" />
                                <span>다시 추천</span>
                            </button>
                            <button
                                onClick={onShare}
                                aria-label="추천 메뉴 공유하기"
                                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl
                  bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20
                  text-white/70 hover:text-white font-medium text-xs transition-all duration-300
                  active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                            >
                                <Share2 size={14} className="shrink-0" aria-hidden="true" />
                                <span>공유</span>
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}
