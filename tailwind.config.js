/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#1b084d",
        secondary: "#aaa6c3",
      },
    },
  },
  plugins: [],
};
