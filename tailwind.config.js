/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb',
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb', // Brand Main Blue
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        accent: {
          DEFAULT: '#f97316', // Brand Accent Orange
          500: '#f97316',
          600: '#ea580c',
        },
        navy: {
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        surface: {
          light: '#ffffff',
          dark: '#0f172a',
          card: '#1e293b',
          'container-low': '#f2f4f6',
          'container-high': '#e6e8ea',
          'container-highest': '#e0e3e5',
          'container-lowest': '#ffffff',
          'variant': '#e0e3e5',
        },
        'on-surface': {
          DEFAULT: '#191c1e',
          variant: '#424752',
        },
        'outline-variant': '#c2c6d4',
        'primary-container': '#0056b3',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: '0', transform: 'translateY(10px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
