/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/pages/**/*.{js,ts,jsx,tsx,mdx}", "./src/components/**/*.{js,ts,jsx,tsx,mdx}", "./src/app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: { animation: { marquee: "marquee 25s linear infinite" }, keyframes: { marquee: { "0%": { transform: "translateX(100%)" }, "100%": { transform: "translateX(-100%)" } } } } },
  plugins: [require("@tailwindcss/typography")],
};
