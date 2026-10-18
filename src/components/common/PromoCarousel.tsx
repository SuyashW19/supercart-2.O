import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Coffee,
  Apple,
  Milk,
  Cookie,
  ShoppingBag,
} from "lucide-react";
import { BannerInfo } from "../../types";

interface PromoCarouselProps {
  banners: BannerInfo[];
  isLoading?: boolean;
  onSelectCategory?: (categoryId: string) => void;
}

interface BannerThemeConfig {
  gradientLight: string;
  gradientDark: string;
  badgeBg: string;
  badgeText: string;
  titleColor: string;
  subtitleColor: string;
  buttonBg: string;
  buttonHover: string;
  buttonShadow: string;
  defaultBadge: string;
  fallbackIcon: React.ElementType;
}

// Map category or title keywords to soft aesthetic Blinkit/Zepto-style pastel gradients
function getBannerTheme(banner: BannerInfo): BannerThemeConfig {
  const cat = (banner.category_id || "").toLowerCase();
  const title = (banner.title || "").toLowerCase();

  // 1. Breakfast (warm cream / golden yellow)
  if (title.includes("breakfast") || title.includes("morning") || (cat === "dairy-bread-eggs" && title.includes("breakfast"))) {
    return {
      gradientLight: "from-amber-50 via-amber-100/70 to-orange-100/60",
      gradientDark: "dark:from-[#2a1d12] dark:via-[#22160c] dark:to-[#170e06]",
      badgeBg: "bg-amber-500/20 dark:bg-amber-400/20 text-amber-900 dark:text-amber-200 border border-amber-300/60 dark:border-amber-700/50",
      badgeText: "text-amber-900 dark:text-amber-200",
      titleColor: "text-amber-950 dark:text-amber-50",
      subtitleColor: "text-amber-900/80 dark:text-amber-200/80",
      buttonBg: "bg-amber-600 hover:bg-amber-700 text-white",
      buttonHover: "hover:bg-amber-700",
      buttonShadow: "shadow-amber-900/20",
      defaultBadge: "Morning Express • 10 Mins",
      fallbackIcon: Coffee,
    };
  }

  // 2. Fruits & Vegetables (light fresh green)
  if (cat.includes("fruit") || cat.includes("veg") || title.includes("green") || title.includes("farm")) {
    return {
      gradientLight: "from-emerald-50 via-emerald-100/70 to-teal-100/60",
      gradientDark: "dark:from-[#0d2818] dark:via-[#092013] dark:to-[#05160d]",
      badgeBg: "bg-emerald-500/20 dark:bg-emerald-400/20 text-emerald-900 dark:text-emerald-200 border border-emerald-300/60 dark:border-emerald-700/50",
      badgeText: "text-emerald-900 dark:text-emerald-200",
      titleColor: "text-emerald-950 dark:text-emerald-50",
      subtitleColor: "text-emerald-900/80 dark:text-emerald-200/80",
      buttonBg: "bg-emerald-600 hover:bg-emerald-700 text-white",
      buttonHover: "hover:bg-emerald-700",
      buttonShadow: "shadow-emerald-900/20",
      defaultBadge: "Farm Direct • 10 Mins",
      fallbackIcon: Apple,
    };
  }

  // 3. Dairy & Eggs (light crisp blue / sky)
  if (cat.includes("dairy") || title.includes("dairy") || title.includes("milk") || title.includes("paneer")) {
    return {
      gradientLight: "from-sky-50 via-blue-100/70 to-indigo-100/60",
      gradientDark: "dark:from-[#0c2340] dark:via-[#081a30] dark:to-[#051120]",
      badgeBg: "bg-sky-500/20 dark:bg-sky-400/20 text-sky-900 dark:text-sky-200 border border-sky-300/60 dark:border-sky-700/50",
      badgeText: "text-sky-900 dark:text-sky-200",
      titleColor: "text-slate-900 dark:text-sky-50",
      subtitleColor: "text-slate-700 dark:text-sky-200/80",
      buttonBg: "bg-blue-600 hover:bg-blue-700 text-white",
      buttonHover: "hover:bg-blue-700",
      buttonShadow: "shadow-blue-900/20",
      defaultBadge: "Chilled & Fresh • 10 Mins",
      fallbackIcon: Milk,
    };
  }

  // 4. Snacks & Munchies (light warm orange / peach)
  return {
    gradientLight: "from-orange-50 via-amber-100/70 to-yellow-100/60",
    gradientDark: "dark:from-[#2c1705] dark:via-[#221203] dark:to-[#170a01]",
    badgeBg: "bg-orange-500/20 dark:bg-orange-400/20 text-orange-900 dark:text-orange-200 border border-orange-300/60 dark:border-orange-700/50",
    badgeText: "text-orange-900 dark:text-orange-200",
    titleColor: "text-orange-950 dark:text-orange-50",
    subtitleColor: "text-orange-900/80 dark:text-orange-200/80",
    buttonBg: "bg-orange-600 hover:bg-orange-700 text-white",
    buttonHover: "hover:bg-orange-700",
    buttonShadow: "shadow-orange-900/20",
    defaultBadge: "Tea Time Saver • 10 Mins",
    fallbackIcon: Cookie,
  };
}

const AUTOPLAY_DURATION_MS = 5000;

export const PromoCarousel: React.FC<PromoCarouselProps> = ({
  banners,
  isLoading = false,
  onSelectCategory,
}) => {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  const progressRef = useRef<number>(0);
  const lastTickRef = useRef<number>(Date.now());

  // Reset progress when current index changes
  useEffect(() => {
    setProgress(0);
    progressRef.current = 0;
    lastTickRef.current = Date.now();
  }, [current]);

  // Autoplay and smooth progress bar timer (Instagram stories style)
  useEffect(() => {
    if (!banners || banners.length <= 1) return;

    const interval = setInterval(() => {
      if (isPaused) {
        lastTickRef.current = Date.now();
        return;
      }

      const now = Date.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;

      progressRef.current = Math.min(100, progressRef.current + (delta / AUTOPLAY_DURATION_MS) * 100);
      setProgress(progressRef.current);

      if (progressRef.current >= 100) {
        progressRef.current = 0;
        setProgress(0);
        setCurrent((prev) => (prev + 1) % banners.length);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [banners, isPaused]);

  const handleNext = useCallback(() => {
    if (!banners || banners.length === 0) return;
    setCurrent((prev) => (prev + 1) % banners.length);
  }, [banners]);

  const handlePrev = useCallback(() => {
    if (!banners || banners.length === 0) return;
    setCurrent((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  }, [banners]);

  if (isLoading) {
    return (
      <div className="w-full rounded-2xl overflow-hidden aspect-[16/9] sm:aspect-[3/1] max-h-76 bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center border border-slate-200 dark:border-slate-800">
        <div className="text-center text-slate-400 flex flex-col items-center gap-2">
          <Sparkles className="w-7 h-7 animate-spin text-emerald-500" />
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Curating 10-Minute Deals...
          </p>
        </div>
      </div>
    );
  }

  if (!banners || banners.length === 0) {
    return null;
  }

  const active = banners[current % banners.length];
  const theme = getBannerTheme(active);
  const FallbackIcon = theme.fallbackIcon || ShoppingBag;
  const isImageFailed = failedImages[active.id || active.image_url];
  const isImageLoaded = loadedImages[active.id || active.image_url];

  // Helper to generate responsive srcset for Unsplash / Pexels CDN images
  const getSrcSet = (url: string) => {
    if (!url || !url.includes("unsplash.com")) return undefined;
    const base = url.split("?")[0];
    return `${base}?w=600&auto=format&fit=crop&fm=webp&q=80 600w, ${base}?w=1000&auto=format&fit=crop&fm=webp&q=80 1000w, ${base}?w=1400&auto=format&fit=crop&fm=webp&q=80 1400w`;
  };

  return (
    <div
      className="relative w-full group select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Main Banner Card - Blinkit/Zepto Split Layout */}
      <div
        className={`relative w-full rounded-2xl overflow-hidden aspect-[16/9] sm:aspect-[3/1] max-h-76 bg-gradient-to-r ${theme.gradientLight} ${theme.gradientDark} border border-slate-200/60 dark:border-slate-800/80 shadow-sm transition-colors duration-700 flex flex-row items-stretch`}
      >
        {/* Left Side: Offer Chip, Headline, Subtitle, CTA Button */}
        <div className="w-[58%] sm:w-[54%] md:w-[50%] p-4 sm:p-6 md:p-8 flex flex-col justify-center z-10">
          {/* Offer Chip */}
          <div className="animate-text-stagger-1 mb-1.5 sm:mb-2">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-black tracking-wide uppercase ${theme.badgeBg}`}
            >
              <Sparkles className="w-3 h-3 text-current shrink-0" />
              <span>{active.badge_text || theme.defaultBadge}</span>
            </span>
          </div>

          {/* Bold Headline */}
          <h2
            className={`animate-text-stagger-2 text-base sm:text-2xl md:text-3xl font-black tracking-tight leading-tight mb-1 sm:mb-2 ${theme.titleColor} line-clamp-2`}
          >
            {active.title}
          </h2>

          {/* One-Line Subtitle */}
          {active.subtitle && (
            <p
              className={`animate-text-stagger-3 text-[11px] sm:text-xs md:text-sm font-medium line-clamp-1 sm:line-clamp-2 mb-3 sm:mb-4 ${theme.subtitleColor}`}
            >
              {active.subtitle}
            </p>
          )}

          {/* "Shop Now" Button with gentle shine sweep */}
          <div className="animate-text-stagger-4 flex items-center">
            <button
              onClick={() => active.category_id && onSelectCategory?.(active.category_id)}
              className={`relative overflow-hidden px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all transform active:scale-95 cursor-pointer shadow-md ${theme.buttonBg} ${theme.buttonShadow} inline-flex items-center gap-2 group/btn`}
            >
              {/* Shine Sweep Overlay */}
              <span
                aria-hidden="true"
                className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/35 to-transparent -skew-x-20 pointer-events-none animate-shine-sweep"
              />
              <span className="relative z-10">{active.cta_text || "Shop Now"}</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 relative z-10 transition-transform group-hover/btn:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Right Side: Clean, well-lit real photo in a group */}
        <div className="w-[42%] sm:w-[46%] md:w-[50%] relative flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          {/* Subtle decorative radial backdrop matching the photo */}
          <div className="absolute inset-0 bg-radial from-white/40 via-transparent to-transparent dark:from-white/5 pointer-events-none" />

          {!isImageFailed ? (
            <div className="relative w-full h-full flex items-center justify-center animate-banner-float">
              {/* Blur-up placeholder while loading */}
              {!isImageLoaded && (
                <div className="absolute inset-2 sm:inset-4 rounded-xl bg-slate-200/70 dark:bg-slate-700/50 backdrop-blur-md animate-pulse flex items-center justify-center">
                  <FallbackIcon className="w-8 h-8 text-slate-400 opacity-60" />
                </div>
              )}

              {/* Product Photo with slow Ken Burns zoom */}
              <img
                key={active.id || active.image_url}
                src={active.image_url}
                srcSet={getSrcSet(active.image_url)}
                sizes="(max-width: 640px) 45vw, (max-width: 1024px) 45vw, 500px"
                alt={active.title}
                loading={current === 0 ? "eager" : "lazy"}
                referrerPolicy="no-referrer"
                onLoad={() => {
                  setLoadedImages((prev) => ({
                    ...prev,
                    [active.id || active.image_url]: true,
                  }));
                }}
                onError={() => {
                  setFailedImages((prev) => ({
                    ...prev,
                    [active.id || active.image_url]: true,
                  }));
                }}
                className={`w-full h-full max-h-68 object-cover rounded-xl shadow-lg border border-white/50 dark:border-white/10 transition-opacity duration-500 animate-ken-burns ${
                  isImageLoaded ? "opacity-100" : "opacity-0"
                }`}
              />
            </div>
          ) : (
            /* Fallback clean gradient card with themed product icon when photo fails to load */
            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
              <div className="p-4 rounded-2xl bg-white/60 dark:bg-black/20 backdrop-blur-xs border border-white/40 dark:border-white/10 shadow-xs mb-2">
                <FallbackIcon className="w-10 h-10 sm:w-14 sm:h-14 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                10-Minute Dark Store Dispatch
              </span>
            </div>
          )}
        </div>

        {/* Carousel Arrow Navigation Buttons */}
        {banners.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              aria-label="Previous slide"
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-full bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 text-slate-800 dark:text-white shadow-md backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-20"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              aria-label="Next slide"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-full bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 text-slate-800 dark:text-white shadow-md backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-20"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </>
        )}
      </div>

      {/* Animated Instagram-Story Style Progress Bars (filling over 5s) */}
      {banners.length > 1 && (
        <div className="flex items-center gap-2 mt-2 px-1">
          {banners.map((b, idx) => {
            const isActive = idx === current;
            const isCompleted = idx < current;
            const fillWidth = isActive ? `${progress}%` : isCompleted ? "100%" : "0%";

            return (
              <button
                key={b.id || idx}
                onClick={() => setCurrent(idx)}
                aria-label={`Jump to slide ${idx + 1}: ${b.title}`}
                className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden cursor-pointer hover:h-2 transition-all"
              >
                <div
                  className="h-full bg-emerald-600 dark:bg-emerald-400 rounded-full transition-[width] ease-linear duration-75"
                  style={{ width: fillWidth }}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
