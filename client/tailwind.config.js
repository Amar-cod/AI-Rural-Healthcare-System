/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#F7FBFC',
        'bg-card': '#FFFFFF',
        'brand-primary': '#2A9D8F',
        'brand-secondary': '#5AB1BF',
        'accent-soft-blue': '#E8F4F8',
        'accent-soft-green': '#E6F4EA',
        'accent-soft-amber': '#FFF4E0',
        'priority-high': '#E76F51',
        'priority-high-bg': '#FDEDEA',
        'priority-medium': '#F4A261',
        'priority-medium-bg': '#FFF4E6',
        'priority-routine': '#2A9D8F',
        'priority-routine-bg': '#E9F7F5',
        'text-primary': '#1F2937',
        'text-secondary': '#6B7280',
        'border-color': '#E5EAEE',
        'danger': '#D64545',
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
