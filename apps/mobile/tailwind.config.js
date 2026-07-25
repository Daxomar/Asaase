/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Mirrors apps/dashboard/app/globals.css --forest/--gold tokens (A-19: same product
      // family across mobile + dashboard, not a from-scratch mobile palette).
      colors: {
        "forest-deep": "#0f2a1a",
        "forest-ink": "#123d24",
        forest: "#14432a",
        green: "#1e8a46",
        gold: "#d9ac39",
        "gold-soft": "#faf0d6",
        critical: "#b8382f",
        "text-on-dark": "#f3f1e6",
        "text-on-dark-muted": "#9fb0a2",
      },
    },
  },
  plugins: [],
};
