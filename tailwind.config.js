/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1d4ed8',
          dark: '#1e3a8a',
          light: '#dbeafe',
        },
        cta: '#f97316',
        urgent: '#dc2626',
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
