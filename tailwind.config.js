/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bhagwa: {
          light: '#fff3e0',
          DEFAULT: '#ff6600', // मुख्य भगवा बटन आणि हायलाईट्ससाठी
          dark: '#e65c00',
        },
        navy: {
          sidebar: '#0b132b', // "ChatGPT Image Jun 22, 2026, 12_26_06 PM.png" मधील डार्क नेव्ही
          bg: '#f4f6f9',      
          text: '#1e293b'
        }
      }
    },
  },
  plugins: [],
}