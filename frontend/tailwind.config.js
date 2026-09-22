/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0a0c0f',        // Deep near-black background
          surface: '#12161d',   // Primary card surface
          card: '#181d26',      // Raised element surface
          hover: '#202632',     // Hover state
          border: '#273142',    // Subtle graphite border
          muted: '#8e9baa',     // Muted secondary text
          light: '#f1f4f9',     // Main text
        },
        brand: {
          emerald: '#10b981',   // Compliant electric green
          emeraldDark: '#047857',
          emeraldGlow: 'rgba(16, 185, 129, 0.15)',
          amber: '#f59e0b',     // Warning / review required
          amberDark: '#b45309',
          amberGlow: 'rgba(245, 158, 11, 0.15)',
          crimson: '#ef4444',   // Violation / non-compliant
          crimsonDark: '#b91c1c',
          crimsonGlow: 'rgba(239, 68, 68, 0.15)',
          teal: '#14b8a6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.25)',
        'glow-amber': '0 0 25px -5px rgba(245, 158, 11, 0.25)',
        'glow-crimson': '0 0 25px -5px rgba(239, 68, 68, 0.25)',
        'card-dark': '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
}
