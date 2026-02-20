"use client";

import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface PhoneFrameProps {
    children: React.ReactNode;
}

export default function PhoneFrame({ children }: PhoneFrameProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [isDesktop, setIsDesktop] = useState(false);

    // Mouse tilt effect
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 300, damping: 30 });
    const mouseY = useSpring(y, { stiffness: 300, damping: 30 });

    const rotateX = useTransform(mouseY, [-0.5, 0.5], [5, -5]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], [-5, 5]);

    useEffect(() => {
        const mq = window.matchMedia("(min-width: 768px)");
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsDesktop(mq.matches);

        const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
        mq.addEventListener("change", handler);

        return () => mq.removeEventListener("change", handler);
    }, []);

    useEffect(() => {
        let rafId: number | null = null;

        const handleMouseMove = (e: MouseEvent) => {
            if (rafId !== null) return;
            rafId = requestAnimationFrame(() => {
                const { innerWidth, innerHeight } = window;
                const xPos = (e.clientX / innerWidth) - 0.5;
                const yPos = (e.clientY / innerHeight) - 0.5;
                x.set(xPos);
                y.set(yPos);
                rafId = null;
            });
        };

        if (isDesktop) {
            window.addEventListener("mousemove", handleMouseMove);
        }

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            if (rafId !== null) cancelAnimationFrame(rafId);
        };
    }, [x, y, isDesktop]);

    // 모바일: 전체화면, 폰 프레임 없음
    if (!isDesktop) {
        return (
            <div className="min-h-[100dvh] w-full bg-[#1A1A2E] overflow-hidden">
                {children}
            </div>
        );
    }

    // 데스크톱: 폰 프레임 UI
    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 perspective-1000 overflow-hidden">
            <motion.div
                ref={ref}
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: "preserve-3d",
                }}
                className="relative w-full max-w-[400px] h-[800px] max-h-[90vh] bg-black rounded-[3rem] shadow-2xl border-[8px] border-zinc-800"
            >
                {/* Dynamic Shadow / Reflection */}
                <motion.div
                    style={{
                        opacity: 0.4,
                        background: `linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)`
                    }}
                    className="absolute inset-0 z-50 pointer-events-none rounded-[2.5rem]"
                />

                {/* Notch / Dynamic Island */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl z-50 flex items-center justify-center px-4">
                    <div className="w-16 h-4 bg-zinc-900 rounded-full" />
                </div>

                {/* Screen Content */}
                <div className="w-full h-full bg-[#1A1A2E] rounded-[2.5rem] overflow-hidden overflow-y-auto scrollbar-hide">
                    {children}
                </div>

                {/* Side Buttons (Visual only) */}
                <div className="absolute top-24 -right-[10px] w-1 h-12 bg-zinc-700 rounded-r-md" />
                <div className="absolute top-40 -right-[10px] w-1 h-20 bg-zinc-700 rounded-r-md" />
            </motion.div>
        </div>
    );
}
