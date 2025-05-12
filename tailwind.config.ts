// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"], // Essential for Shadcn/UI dark mode
    content: [
      // Adjusted for App Router and components directory at root
      "./app/**/*.{js,ts,jsx,tsx,mdx}",
      "./components/**/*.{js,ts,jsx,tsx,mdx}",
      // Remove "./pages/**/*.{js,ts,jsx,tsx,mdx}" if you don't have a pages dir
      // Remove "*.{js,ts,jsx,tsx,mdx}" as it's too broad for root
    ],
    theme: {
      extend: { // Keep your existing colors, borderRadius, keyframes, animation
        colors: { /* ... your colors from old config ... */
          background: 'hsl(var(--background))',
          foreground: 'hsl(var(--foreground))',
          // ... ALL your color definitions
          sidebar: {
            DEFAULT: 'hsl(var(--sidebar-background))',
            foreground: 'hsl(var(--sidebar-foreground))',
            // ... rest of sidebar colors
          },
        },
        borderRadius: { /* ... your borderRadius from old config ... */
          lg: 'var(--radius)',
          md: 'calc(var(--radius) - 2px)',
          sm: 'calc(var(--radius) - 4px)'
        },
        keyframes: { /* ... your keyframes from old config ... */
          'accordion-down': { /* ... */ },
          'accordion-up': { /* ... */ }
        },
        animation: { /* ... your animation from old config ... */
          'accordion-down': 'accordion-down 0.2s ease-out',
          'accordion-up': 'accordion-up 0.2s ease-out'
        },
        fontFamily: { // Add this if you used next/font variables
          sans: ['var(--font-noto-sans-hebrew)', 'Arial', 'Helvetica', 'sans-serif'],
          mekorot: ['var(--font-mekorot-rashi)', 'serif'],
        },
      }
    },
    plugins: [require("tailwindcss-animate")], // Keep this
};
export default config;