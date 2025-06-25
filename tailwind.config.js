/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'system-ui', 'sans-serif'],
        'mono': ['Menlo', 'Monaco', 'SF Mono', 'ui-monospace', 'SFMono-Regular', 'Cascadia Code', 'Roboto Mono', 'Lucida Console', 'monospace'],
        'sf': ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Helvetica Neue', 'Arial', 'sans-serif'],
        'apple': ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'system-ui', 'sans-serif'],
        'apple-mono': ['Menlo', 'Monaco', 'SF Mono', 'ui-monospace', 'SFMono-Regular', 'Cascadia Code', 'Roboto Mono', 'Lucida Console', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
      },
      colors: {
        apple: {
          blue: '#007AFF',
          purple: '#AF52DE',
          green: '#34C759',
          red: '#FF3B30',
          orange: '#FF9500',
          gray: {
            50: '#F2F2F7',
            100: '#E5E5EA',
            200: '#D1D1D6',
            300: '#C7C7CC',
            400: '#AEAEB2',
            500: '#8E8E93',
            600: '#636366',
            700: '#48484A',
            800: '#3A3A3C',
            900: '#1C1C1E',
          }
        }
      },
      animation: {
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
  darkMode: 'class',
} 