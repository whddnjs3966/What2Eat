"use client";

import { RotateCcw } from "lucide-react";
import { MenuItem } from "@/data/menuDatabase";
import ResultCard from "./ResultCard";

interface ResultScreenProps {
    menu: MenuItem;
    reason: string;
    onRetry: () => void;
    onShare: () => void;
    onMap: () => void;
    onReset: () => void;
}

export default function ResultScreen({
    menu,
    reason,
    onRetry,
    onShare,
    onMap,
    onReset,
}: ResultScreenProps) {
    return (
        <div className="flex-1 flex flex-col overflow-y-auto scrollbar-hide z-10 p-4 sm:p-5">
            <div className="m-auto w-full max-w-md py-6 sm:py-8">
                <ResultCard
                    menu={menu}
                    reason={reason}
                    onRetry={onRetry}
                    onShare={onShare}
                    onMap={onMap}
                />
                <button
                    onClick={onReset}
                    aria-label="처음부터 다시 시작"
                    className="mt-6 w-full text-white/50 text-sm flex items-center justify-center gap-2 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 rounded-lg py-1"
                >
                    <RotateCcw size={14} aria-hidden="true" /> 처음으로
                </button>
            </div>
        </div>
    );
}
