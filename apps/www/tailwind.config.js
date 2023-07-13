const config = require('config/tailwind.config')

module.exports = config({
  content: [
    '../../packages/common/**/*.{ts,tsx}',
    '../../packages/ui/**/*.{tsx,ts,js}',
    './pages/**/*.{tsx,mdx}',
    './components/**/*.tsx',
    './layouts/**/*.tsx',
    './src/**/*.{ts,tsx,mdx}',
    './_blog/*.mdx',
  ],
  theme: {
    extend: {
      keyframes: {
        'flash-code': {
          '0%': { backgroundColor: 'rgba(63, 207, 142, 0.1)' },
          '100%': { backgroundColor: 'transparent' },
        },
        fadeIn: {
          '0%, 100%': { opacity: '1' },
        },
        slideIn: {
          '0%, 100%': { transform: 'translate3d(0,0,0)' },
        },
        slideIn: {
          '0%, 100%': { transform: 'translate3d(0,0,0)' },
        },
        spin: {
          '0%, 100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'flash-code': 'flash-code 1s forwards',
        'flash-code-slow': 'flash-code 2s forwards',
        spin: 'spin 1s both infinite',
      },
    },
  },
})
