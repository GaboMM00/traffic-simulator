/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0d1117',
        surface: '#161b22',
        'surface-hover': '#1c2333',
        border: '#30363d',
        accent: '#58a6ff',
        'accent-hover': '#79c0ff',
        'text-primary': '#e6edf3',
        'text-secondary': '#8b949e',
        'text-muted': '#484f58',
        'traffic-green': '#3fb950',
        'traffic-yellow': '#d29922',
        'traffic-red': '#f85149',
        gold: '#f0c060',
      },
    },
  },
  plugins: [],
}
