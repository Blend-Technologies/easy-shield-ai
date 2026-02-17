import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Montserrat", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Custom palette
        "neon-pink": {
          DEFAULT: "hsl(var(--neon-pink))",
          50: "#fdd4e6",
          100: "#fca8ce",
          200: "#fa7db5",
          300: "#f9529d",
          400: "#f72585",
          500: "#dc0868",
          600: "#a5064e",
          700: "#6e0434",
          800: "#37021a",
        },
        "indigo-bloom": {
          DEFAULT: "hsl(var(--indigo-bloom))",
          50: "#e5c3fc",
          100: "#cb86f9",
          200: "#b14af6",
          300: "#980df4",
          400: "#7209b7",
          500: "#5c0794",
          600: "#45056f",
          700: "#2e034a",
          800: "#170225",
        },
        "vivid-royal": {
          DEFAULT: "hsl(var(--vivid-royal))",
          50: "#d2c0fa",
          100: "#a582f6",
          200: "#7743f1",
          300: "#4f11e0",
          400: "#3a0ca3",
          500: "#2e0a81",
          600: "#220761",
          700: "#170541",
          800: "#0b0220",
        },
        "electric-sapphire": {
          DEFAULT: "hsl(var(--electric-sapphire))",
          50: "#dae0fc",
          100: "#b4c1f8",
          200: "#8fa2f5",
          300: "#6a83f1",
          400: "#4361ee",
          500: "#153ae0",
          600: "#102ca8",
          700: "#0a1d70",
          800: "#050f38",
        },
        "sky-aqua": {
          DEFAULT: "hsl(var(--sky-aqua))",
          50: "#dbf4fc",
          100: "#b7eaf9",
          200: "#93dff6",
          300: "#70d5f3",
          400: "#4cc9f0",
          500: "#13b8ea",
          600: "#0e8aaf",
          700: "#095c75",
          800: "#052e3a",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px hsl(330 93% 56% / 0.2)" },
          "50%": { boxShadow: "0 0 40px hsl(330 93% 56% / 0.4)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "float": "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
