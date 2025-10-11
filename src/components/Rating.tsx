// components/Rating.tsx
import React, { MouseEvent, TouchEvent, useCallback } from "react";

interface RatingProps {
  value: number; // 현재 점수 (0 ~ 5)
  onChange: (v: number) => void; // 변경 콜백
  step?: number; // 0.5 또는 1
  icon?: string; // 별 마스크(svg) 경로
  sizePx?: number; // 별 크기(px)
}

const Rating: React.FC<RatingProps> = ({
  value,
  onChange,
  step = 1,
  icon = "/icons/star.svg",
  sizePx = 25,
}) => {
  // index(0~4)번째 별에서 클릭/터치 위치로 0.5 또는 1.0 결정
  const calcNewValue = useCallback(
    (index: number, xRatio: number) => {
      if (step === 0.5) {
        const half = xRatio <= 0.5 ? 0.5 : 1;
        return index + half;
      }
      return index + 1;
    },
    [step]
  );

  const handleClick = (index: number) => (e: MouseEvent<HTMLButtonElement>) => {
    const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
    const xRatio = Math.min(
      1,
      Math.max(0, (e.clientX - rect.left) / rect.width)
    );
    onChange(calcNewValue(index + 0, xRatio));
  };

  const handleTouch = (index: number) => (e: TouchEvent<HTMLButtonElement>) => {
    const touch = e.touches[0];
    if (!touch) return;
    const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
    const xRatio = Math.min(
      1,
      Math.max(0, (touch.clientX - rect.left) / rect.width)
    );
    onChange(calcNewValue(index + 0, xRatio));
  };

  return (
    <div className="flex gap-2" role="radiogroup" aria-label="rating">
      {Array.from({ length: 5 }).map((_, i) => {
        // i번째 별의 채움 비율 계산 (0, 50, 100)
        const full = i + 1;
        const half = i + 0.5;
        const fillPercent = value >= full ? 100 : value >= half ? 50 : 0;

        return (
          <button
            key={i}
            type="button"
            onClick={handleClick(i)}
            onTouchStart={handleTouch(i)}
            aria-checked={value > i && value <= i + 1}
            role="radio"
            className="relative h-10"
            style={{ width: sizePx, height: sizePx }}
          >
            <div className="absolute inset-0">
              {/* 기본 회색 별 배경 */}
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  maskImage: `url(${icon})`,
                  WebkitMaskImage: `url(${icon})`,
                  maskSize: "cover",
                  WebkitMaskSize: "cover",
                  backgroundColor: "#E5E7EB", // gray-200 정도 (기본 회색)
                }}
              />

              {/* 흰색 내부 채움 (선택사항: 중첩 시 필요 없으면 제거 가능) */}
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  maskImage: `url(${icon})`,
                  WebkitMaskImage: `url(${icon})`,
                  maskSize: "cover",
                  WebkitMaskSize: "cover",
                  backgroundColor: "#FFFFFF",
                  mixBlendMode: "lighten",
                }}
              />
            </div>
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                width: `${fillPercent}%`,
                overflow: "hidden",
              }}
            >
              <div
                className="w-full h-full"
                style={{
                  maskImage: `url(${icon})`,
                  WebkitMaskImage: `url(${icon})`,
                  maskSize: "cover",
                  WebkitMaskSize: "cover",
                  backgroundColor: "#F97316", // orange-500
                }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default Rating;
