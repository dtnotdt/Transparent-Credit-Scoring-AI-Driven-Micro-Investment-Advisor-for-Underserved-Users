/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      colors: {
        // Brand palette — Vibrant Crimson Red, Amber Yellow & Clean White theme
        primary: {
          50:  '#fef2f2',
          100: '#ffe4e4',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626', // primary crimson red
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        accent: {
          300: '#fde047',
          400: '#facc15', // gold yellow
          500: '#eab308', // amber yellow accent
          600: '#ca8a04',
          700: '#a16207',
        },
        dark: {
          900: '#18181b',
          950: '#09090b',
        },
        success: '#10b981',
        warning: '#f59e0b',
        danger:  '#dc2626',
        // Glass surface
        glass: {
          100: 'rgba(255, 255, 255, 0.05)',
          200: 'rgba(255, 255, 255, 0.10)',
          300: 'rgba(255, 255, 255, 0.15)',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(135deg, #FFFFFF 0%, #FFFBEB 50%, #FEF2F2 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(220,38,38,0.05) 0%, rgba(234,179,8,0.03) 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'glow': '0 0 40px rgba(220, 38, 38, 0.15)',
        'glow-lg': '0 0 80px rgba(220, 38, 38, 0.25)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
