/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0b1120',
          800: '#111827',
          700: '#1a2438',
          600: '#243048',
        },
        accent: '#06b6d4',
      },
    },
  },
  plugins: [],
}
