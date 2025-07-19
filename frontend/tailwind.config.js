/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class", // 다크모드 활성화
  theme: {
    extend: {
      colors: {
        // 메인 색상 시스템
        primary: {
          DEFAULT: "#e4e4e7", // zinc-200 (라이트 모드)
          light: "#f4f4f5", // zinc-100
          dark: "#d4d4d8", // zinc-300
        },
        secondary: {
          DEFAULT: "#18181b", // zinc-900 (다크 모드용)
          light: "#27272a", // zinc-800
          dark: "#09090b", // zinc-950
        },
        // 텍스트 색상
        text: {
          primary: "#000000", // black (라이트 모드)
          secondary: "#ffffff", // white (다크 모드)
          muted: "#71717a", // zinc-500
        },
        // 액센트 색상
        accent: {
          yellow: "#eab308", // yellow-500
          "yellow-dark": "#ca8a04", // yellow-600
        },
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: true,
  },
};
