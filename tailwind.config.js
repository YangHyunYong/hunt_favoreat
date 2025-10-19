/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // 1) 폰트 패밀리
      fontFamily: {
        sans: ["Pretendard", "Pretendard Variable", "system-ui", "sans-serif"],
      },

      // 2) 컬러 토큰 (CSS 변수 + fallback)
      colors: {
        gray: {
          50: "var(--Gray-50, #FAFAFA)",
          100: "var(--Gray-100, #F5F5F5)",
          200: "var(--Gray-200, #E5E5E5)",
          400: "var(--Gray-400, #A3A3A3)",
          500: "var(--Gray-500, #737373)",
          600: "var(--Gray-600, #525252)",
          700: "var(--Gray-700, #404040)",
          800: "var(--Gray-800, #262626)",
          900: "var(--Gray-900, #171717)",
          950: "var(--Gray-950, #0A0A0A)",
        },
        blue: {
          700: "var(--Blue-700, #1D4ED8)",
        },
        redorange: {
          400: "var(--Redorange-400, #FF6A32)",
          500: "var(--Redorange-500, #FF4500)",
        },
      },

      // 3) 타이포 토큰 (폰트크기/라인하이트/자간/굵기 내장)
      //   - letterSpacing px → em 변환 적용
      //     0.24px@24px=0.01em, 0.72px@48px=0.015em, 0.3px@20px=0.015em,
      //     0.15px@15px=0.01em, 0.16px@16px=0.01em, 0.24px@12px=0.02em
      fontSize: {
        // (2번) Display
        "display-700": [
          "48px",
          { lineHeight: "46px", letterSpacing: "0.015em", fontWeight: "700" },
        ],

        // (1번) Title
        "title-600": [
          "24px",
          { lineHeight: "24px", letterSpacing: "0.01em", fontWeight: "600" },
        ],

        // (4번) Subtitle
        "place-title": [
          "20px",
          { lineHeight: "28px", letterSpacing: "0.015em", fontWeight: "700" },
        ],

        // (3/13/14번) 버튼 Medium
        "button-content": [
          "15px",
          { lineHeight: "20px", letterSpacing: "0.01em", fontWeight: "700" },
        ],

        // (5/12번) 라벨 굵게
        "rating-count": ["14px", { lineHeight: "20px", fontWeight: "600" }],

        //
        "location-content": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "action-content": ["14px", { lineHeight: "20px", fontWeight: "400" }],

        "review-text-count": [
          "14px",
          { lineHeight: "16px", fontWeight: "400" },
        ],

        // (8/9번) 본문 세미볼드
        "review-title": [
          "16px",
          { lineHeight: "24px", letterSpacing: "0.01em", fontWeight: "600" },
        ],

        // (10번) 본문 레귤러
        "review-content": [
          "15px",
          { lineHeight: "24px", letterSpacing: "0.01em", fontWeight: "400" },
        ],

        // (11번) 캡션
        "caption2-400": [
          "12px",
          { lineHeight: "16px", letterSpacing: "0.02em", fontWeight: "400" },
        ],

        // placeholder
        "placeholder-content": [
          "16px",
          { lineHeight: "24px", letterSpacing: "0.01em", fontWeight: "500" },
        ],
        "confirm-content": [
          "16px",
          { lineHeight: "24px", letterSpacing: "0.01em", fontWeight: "400" },
        ],
      },
    },
  },
  plugins: [],
};
