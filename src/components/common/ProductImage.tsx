import React, { useState } from "react";
import { ShoppingBag } from "lucide-react";

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  category?: string;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  className = "",
  category = "grocery",
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (hasError || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-emerald-50/50 dark:bg-slate-800/80 text-emerald-700 dark:text-emerald-400 p-4 select-none ${className}`}
      >
        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center mb-1">
          <ShoppingBag className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 text-center line-clamp-1">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-white dark:bg-slate-800 ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center">
          <ShoppingBag className="w-6 h-6 text-slate-300 dark:text-slate-600 animate-pulse" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoading(false)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-contain transition-opacity duration-200 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
      />
    </div>
  );
};
