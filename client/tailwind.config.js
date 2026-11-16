/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#6976CC', dark: '#626FC5' },
        lavender: { light: '#C4C9E5', pale: '#D8DFFD' },
        coral: { DEFAULT: '#E98F91', strong: '#E4484B' },
        bg: { main: '#EEF0F6', secondary: '#E8EBF3' },
        text: { primary: '#41465D', secondary: '#929BB8' },
        border: '#E5E8F0',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(65,70,93,0.08), 0 1px 2px rgba(65,70,93,0.04)',
        'card-hover': '0 4px 6px rgba(65,70,93,0.10), 0 2px 4px rgba(65,70,93,0.06)',
        modal: '0 20px 60px rgba(65,70,93,0.15)',
      },
    },
  },
  plugins: [],
}
