/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '480px',
      'sm': '540px',
      'md': '768px',
      'lg': '1025px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        primary: "#191F28",
        secondary: "#4E5968",
        tertiary: "#8B95A1",
        cta: "#3182F6",
        bg: "#F2F4F6",
        surface: "#FFFFFF",
      },
      fontFamily: {
        heading: ['Pretendard', 'sans-serif'],
        body: ['Pretendard', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
