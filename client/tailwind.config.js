/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        action: {
          green: '#16a34a',
          'green-hover': '#15803d',
          orange: '#ea580c',
          red: '#dc2626',
        }
      },
      fontSize: {
        'base': '17px',
        'lg': '19px',
        'xl': '22px',
        '2xl': '26px',
        '3xl': '32px',
      }
    },
  },
  plugins: [],
}
