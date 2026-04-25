/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        accent: "#22c55e",
        danger: "#ef4444",
        background: "var(--background)",
        card: "var(--card)",
        border: "var(--border)",
        secondary: "var(--secondary)",
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        }
      },
      fontFamily: {
        serif: ["PlayfairDisplay-Bold"],
        sans: ["Inter-Regular"],
      }
    },
  },
  plugins: [],
}
