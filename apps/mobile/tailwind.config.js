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
        "green-soft": "#e3f1e7",
        gold: "#d9ac39",
        "gold-soft": "#faf0d6",
        critical: "#b8382f",
        "text-on-dark": "#f3f1e6",
        "text-on-dark-muted": "#9fb0a2",
        // Light surfaces - were missing despite the "mirrors dashboard tokens" intent above;
        // needed for any screen that isn't full-bleed dark (e.g. a light-canvas home screen).
        canvas: "#f4f5ee",
        surface: "#ffffff",
        "surface-sub": "#f7f8f3",
        "text-primary": "#14251b",
        "text-secondary": "#3c4a42",
        "text-muted": "#7c8a82",
        border: "#e4e7dd",
        "border-strong": "#d3d8ca",
      },
    },
  },
  plugins: [],
};
