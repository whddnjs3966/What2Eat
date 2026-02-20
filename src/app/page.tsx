"use client";

import { useCallback, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { useAppStore } from "@/store/useAppStore";
import { stepsConfig } from "@/data/stepsConfig";
import { recommendMenu, getRecommendReason, getWeatherContext } from "@/lib/recommend";
import LoadingAnimation from "@/components/LoadingAnimation";
import PhoneFrame from "@/components/PhoneFrame";
import StartScreen from "@/components/StartScreen";
import SelectionFlow from "@/components/SelectionFlow";
import ResultScreen from "@/components/ResultScreen";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Kakao: any;
  }
}

const KAKAO_SHARE_IMAGE =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop";

export default function Home() {
  const {
    currentStep,
    selections,
    recommendedMenu,
    showResult,
    isAnimating,
    weather,
    nextStep,
    prevStep,
    setSelection,
    setRecommendedMenu,
    setShowResult,
    setIsAnimating,
    setWeather,
    reset,
  } = useAppStore();

  const [started, setStarted] = useState(false);
  const [excludeIds, setExcludeIds] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // 카카오 SDK 초기화
  useEffect(() => {
    if (typeof window !== "undefined" && window.Kakao && !window.Kakao.isInitialized()) {
      const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
      if (kakaoKey) {
        window.Kakao.init(kakaoKey);
      }
    }
  }, []);

  // 날씨 데이터 가져오기
  useEffect(() => {
    if (weather.loaded) return;

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}`);
            const data = await res.json();

            if (data.temp !== undefined) {
              setWeather(data.temp, data.condition);
              const weatherContext = getWeatherContext(data.temp, data.condition);
              if (weatherContext && !selections.context.length) {
                setSelection("context", [weatherContext]);
              }
            }
          } catch {
            setWeather(22, "Clear");
          }
        },
        () => setWeather(22, "Clear")
      );
    } else {
      setWeather(22, "Clear");
    }
  }, [weather.loaded, setWeather, setSelection, selections.context]);

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
        if (currentStep < stepsConfig.length - 1) nextStep();
        else handleRecommend();
      }, 300);
    }
  };

  const handleNext = () => {
    if (currentStep < stepsConfig.length - 1) nextStep();
    else handleRecommend();
  };

  const handleSkip = () => {
    setSelection(stepsConfig[currentStep].id, ["패스"]);
    handleNext();
  };

  const handleRecommend = useCallback(() => {
    setIsAnimating(true);
    setShowResult(false);
  }, [setIsAnimating, setShowResult]);

  const handleLoadingComplete = useCallback(() => {
    const result = recommendMenu(selections, excludeIds, weather.temp);
    if (result.recommended) setRecommendedMenu(result.recommended);
    setIsAnimating(false);
    setShowResult(true);
  }, [selections, excludeIds, weather.temp, setRecommendedMenu, setIsAnimating, setShowResult]);

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
    if (!recommendedMenu) return;

    const title = `오늘 메뉴는 ${recommendedMenu.name}이다!`;
    const description = `😋 오늘은 ${recommendedMenu.name}이 먹고 싶어요! 같이 먹을래요?\n${getRecommendReason(recommendedMenu, selections)}`;

    if (typeof window !== "undefined" && window.Kakao && window.Kakao.isInitialized()) {
      window.Kakao.Share.sendDefault({
        objectType: "feed",
        content: {
          title,
          description,
          imageUrl: KAKAO_SHARE_IMAGE,
          link: {
            mobileWebUrl: window.location.href,
            webUrl: window.location.href,
          },
        },
        buttons: [
          {
            title: "나도 메뉴 추천받기",
            link: {
              mobileWebUrl: window.location.origin,
              webUrl: window.location.origin,
            },
          },
        ],
      });
    } else if (navigator.share) {
      navigator
        .share({ title, text: description, url: window.location.href })
        .catch(() => {
          navigator.clipboard
            .writeText(`오늘은 ${recommendedMenu.name} 어때? 같이 먹을래요?`)
            .then(() => showToast("링크가 클립보드에 복사됐어요!"))
            .catch(() => showToast("공유에 실패했어요. 다시 시도해주세요."));
        });
    } else {
      navigator.clipboard
        .writeText(`오늘은 ${recommendedMenu.name} 어때? 같이 먹을래요?`)
        .then(() => showToast("링크가 클립보드에 복사됐어요!"))
        .catch(() => showToast("공유에 실패했어요. 다시 시도해주세요."));
    }
  };

  return (
    <PhoneFrame>
      <div className="h-full min-h-[100dvh] md:min-h-0 flex flex-col relative text-white">

        {/* Background Gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[60%] bg-violet-900/40 blur-[80px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[100%] h-[50%] bg-fuchsia-900/30 blur-[80px]" />
        </div>

        {/* 1. 시작 화면 */}
        {!started && (
          <StartScreen weather={weather} onStart={() => setStarted(true)} />
        )}

        {/* 2. 로딩 화면 */}
        {started && isAnimating && (
          <div className="flex-1 flex items-center justify-center z-10">
            <LoadingAnimation onComplete={handleLoadingComplete} />
          </div>
        )}

        {/* 3. 결과 화면 */}
        {started && showResult && recommendedMenu && (
          <ResultScreen
            menu={recommendedMenu}
            reason={getRecommendReason(recommendedMenu, selections)}
            onRetry={handleRetry}
            onShare={handleShare}
            onMap={handleMap}
            onReset={handleReset}
          />
        )}

        {/* 4. 선택 화면 */}
        {started && !isAnimating && !showResult && (
          <SelectionFlow
            currentStep={currentStep}
            totalSteps={stepsConfig.length}
            currentConfig={currentConfig}
            selections={selections}
            onSelect={handleSelect}
            onNext={handleNext}
            onPrev={prevStep}
            onSkip={handleSkip}
            onReset={handleReset}
          />
        )}

        {/* Toast 알림 */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-white/10 border border-white/20 rounded-full text-white text-sm font-medium shadow-lg pointer-events-none"
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </PhoneFrame>
  );
}
