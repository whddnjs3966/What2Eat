"use client";

import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useEffect, useRef } from "react";

interface PhoneFrameProps {
    children: React.ReactNode;
}

export default function PhoneFrame({ children }: PhoneFrameProps) {
    const ref = useRef<HTMLDivElement>(null);

    // Mouse tilt effect
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 300, damping: 30 });
    const mouseY = useSpring(y, { stiffness: 300, damping: 30 });

    const rotateX = useTransform(mouseY, [-0.5, 0.5], [5, -5]); // Reduced tilt
    const rotateY = useTransform(mouseX, [-0.5, 0.5], [-5, 5]); // Reduced tilt
    const brightness = useTransform(mouseY, [-0.5, 0.5], [1.1, 0.9]); // Simulation of light source

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // Calculate normalized position (-0.5 to 0.5)
            const { innerWidth, innerHeight } = window;
            const xPos = (e.clientX / innerWidth) - 0.5;
            const yPos = (e.clientY / innerHeight) - 0.5;

            x.set(xPos);
            y.set(yPos);
        };

        // Only add listener on desktop
        if (window.matchMedia("(min-width: 768px)").matches) {
            window.addEventListener("mousemove", handleMouseMove);
        }

        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [x, y]);

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
