import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        critical: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',
      }
    }
  },
  plugins: [],
}

export default config
