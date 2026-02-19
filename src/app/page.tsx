"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChefHat,
  ArrowLeft,
  ArrowRight,
  SkipForward,
  RotateCcw,
  Utensils,
  Play
} from "lucide-react";

import { useAppStore } from "@/store/useAppStore";
import { stepsConfig } from "@/data/stepsConfig";
import { recommendMenu, getRecommendReason, getWeatherContext } from "@/lib/recommend";
import StepSelector from "@/components/StepSelector";
import ProgressBar from "@/components/ProgressBar";
import ResultCard from "@/components/ResultCard";
import LoadingAnimation from "@/components/LoadingAnimation";
import PhoneFrame from "@/components/PhoneFrame";

export default function Home() {
  const {
    currentStep,
    selections,
    recommendedMenu,
    showResult,
    isAnimating,
    weather,
    setStep,
    nextStep,
    prevStep,
    setSelection,
    setRecommendedMenu,
    setAlternativeMenus,
    setShowResult,
    setIsAnimating,
    setWeather,
    reset,
  } = useAppStore();

  const [started, setStarted] = useState(false);
  const [excludeIds, setExcludeIds] = useState<string[]>([]);

  // 날씨 데이터 가져오기
  useEffect(() => {
    if (weather.loaded) return;

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(
              `/api/weather?lat=${latitude}&lon=${longitude}`
            );
            const data = await res.json();

            if (data.temp !== undefined) {
              setWeather(data.temp, data.condition);
              const weatherContext = getWeatherContext(data.temp, data.condition);
              if (weatherContext && !selections.context) {
                setSelection("context", weatherContext);
              }
            }
          } catch (error) {
            setWeather(22, "Clear");
          }
        },
        () => setWeather(22, "Clear")
      );
    } else {
      setWeather(22, "Clear");
    }
  }, [weather.loaded, setWeather, setSelection, selections.context]);

  const prevStepRef = useRef(0);
  const direction = currentStep >= prevStepRef.current ? 1 : -1;
  const currentConfig = stepsConfig[currentStep];

  const handleSelect = (optionId: string) => {
    const config = stepsConfig[currentStep];

    if (config.multiSelect) {
      const current = (selections[config.id as keyof typeof selections] as string[]) || [];
      const updated = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      setSelection(config.id, updated);
    } else {
      setSelection(config.id, optionId);
      setTimeout(() => {
        if (currentStep < stepsConfig.length - 1) {
          prevStepRef.current = currentStep;
          nextStep();
        } else {
          handleRecommend();
        }
      }, 300);
    }
  };

  const handleNext = () => {
    if (currentStep < stepsConfig.length - 1) {
      prevStepRef.current = currentStep;
      nextStep();
    } else {
      handleRecommend();
    }
  };

  const handlePrev = () => {
    prevStepRef.current = currentStep;
    prevStep();
  };

  const handleSkip = () => {
    setSelection(stepsConfig[currentStep].id, "패스");
    handleNext();
  };

  const handleRecommend = useCallback(() => {
    setIsAnimating(true);
    setShowResult(false);
  }, [setIsAnimating, setShowResult]);

  const handleLoadingComplete = useCallback(() => {
    const result = recommendMenu(selections, excludeIds);
    if (result.recommended) {
      setRecommendedMenu(result.recommended);
      setAlternativeMenus(result.alternatives);
    }
    setIsAnimating(false);
    setShowResult(true);
  }, [selections, excludeIds, setRecommendedMenu, setAlternativeMenus, setIsAnimating, setShowResult]);

  const handleRetry = () => {
    if (recommendedMenu) setExcludeIds((prev) => [...prev, recommendedMenu.id]);
    setShowResult(false);
    setIsAnimating(true);
  };

  const handleReset = () => {
    reset();
    setStarted(false);
    setExcludeIds([]);
  };

  const handleMap = () => {
    if (recommendedMenu) {
      const query = encodeURIComponent(recommendedMenu.name);
      window.open(`https://map.kakao.com/link/search/${query}`, "_blank");
    }
  };

  const handleShare = () => {
    if (recommendedMenu && navigator.share) {
      navigator.share({
        title: `오늘 메뉴: ${recommendedMenu.name}`,
        text: `오늘은 ${recommendedMenu.name}`,
        url: window.location.href,
      }).catch(() => { });
    } else if (recommendedMenu) {
      navigator.clipboard.writeText(`오늘은 ${recommendedMenu.name} 어때?`);
      alert("복사됨!");
    }
  };

  return (
    <PhoneFrame>
      <div className="h-full flex flex-col relative text-white">

        {/* === Background Gradients === */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[60%] bg-violet-900/40 blur-[80px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[100%] h-[50%] bg-fuchsia-900/30 blur-[80px]" />
        </div>

        {/* === Render Content === */}

        {/* 1. 시작 화면 (Start Screen) */}
        {!started && (
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
              <Utensils size={80} className="text-white relative z-10 drop-shadow-xl" />
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

              {/* 날씨 기반 추천 문구 */}
              {weather.loaded && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="py-2 px-4 rounded-full bg-white/10 backdrop-blur-md border border-white/10 inline-block"
                >
                  <p className="text-violet-200 text-sm font-medium">
                    {weather.condition === "Rain" || weather.condition === "Drizzle" || weather.condition === "Thunderstorm"
                      ? "비 오는 날엔 따끈한 국물이나 파전 어때요? ☔️"
                      : weather.condition === "Snow"
                        ? "눈 내리는 날엔 따뜻한 우동 한 그릇! ❄️"
                        : (weather.temp ?? 0) >= 28
                          ? "더운 날씨엔 시원한 냉면이나 콩국수! ☀️"
                          : (weather.temp ?? 0) <= 5
                            ? "쌀쌀한 날씨엔 뜨끈한 국밥 한 그릇! 🧣"
                            : "오늘 같은 날씨엔 맛있는 한 끼로 기분 전환! 🍽️"}
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
              onClick={() => setStarted(true)}
              className="w-full bg-white text-violet-900 font-bold text-xl py-4 rounded-3xl shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center justify-center gap-2 hover:bg-violet-50 transition-colors mt-8"
            >
              <Play fill="currentColor" size={24} />
              시작하기
            </motion.button>
          </motion.div>
        )}

        {/* 2. 로딩 화면 */}
        {started && isAnimating && (
          <div className="flex-1 flex items-center justify-center z-10">
            <LoadingAnimation onComplete={handleLoadingComplete} />
          </div>
        )}

        {/* 3. 결과 화면 */}
        {started && showResult && recommendedMenu && (
          <div className="flex-1 flex flex-col overflow-y-auto z-10 p-4 pt-12 pb-24">
            <ResultCard
              menu={recommendedMenu}
              reason={getRecommendReason(recommendedMenu, selections)}
              onRetry={handleRetry}
              onShare={handleShare}
              onMap={handleMap}
            />
            <button
              onClick={handleReset}
              className="mt-6 text-white/50 text-sm flex items-center justify-center gap-2 hover:text-white"
            >
              <RotateCcw size={14} /> 처음으로
            </button>
          </div>
        )}

        {/* 4. 선택 화면 (Step-by-Step) */}
        {started && !isAnimating && !showResult && (
          <>
            {/* Header */}
            <div className="pt-12 px-6 pb-4 flex items-center justify-between z-10">
              <button onClick={handleReset} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                <RotateCcw size={18} className="text-white/70" />
              </button>
              <div className="text-sm font-bold text-white/40">
                {currentStep + 1} / {stepsConfig.length}
              </div>
            </div>

            {/* Progress */}
            <div className="px-6 mb-6 z-10">
              <ProgressBar currentStep={currentStep} totalSteps={stepsConfig.length} />
            </div>

            {/* Question Area */}
            <div className="flex-1 overflow-y-auto scrollbar-hide z-10 pb-32">
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
                selected={currentConfig.multiSelect
                  ? (selections[currentConfig.id as keyof typeof selections] as string[]) || []
                  : (selections[currentConfig.id as keyof typeof selections] as string)
                }
                multiSelect={currentConfig.multiSelect}
                onSelect={handleSelect}
              />
            </div>

            {/* Bottom Navigation (Fixed) */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent z-20 flex items-center gap-3">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
              )}

              {currentConfig.optional && (
                <button
                  onClick={handleSkip}
                  className="flex-1 bg-white/10 h-12 rounded-2xl font-medium text-white/80 hover:bg-white/20 transition-colors"
                >
                  건너뛰기
                </button>
              )}

              {/* Next Button for Multi-select or Last Step */}
              {(currentConfig.multiSelect || currentStep === stepsConfig.length - 1) && (
                <button
                  onClick={handleNext}
                  className="flex-1 bg-violet-600 h-12 rounded-2xl font-bold text-white shadow-lg shadow-violet-500/30 hover:bg-violet-500 transition-colors flex items-center justify-center gap-2"
                >
                  {currentStep === stepsConfig.length - 1 ? "결과 보기" : "다음"}
                  {currentStep < stepsConfig.length - 1 && (
                    <ArrowRight size={18} />
                  )}
                </button>
              )}
            </div>
          </>
        )}

      </div>
    </PhoneFrame>
  );
}
