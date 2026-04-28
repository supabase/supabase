const config = require('config/tailwind.config')

module.exports = config({
  content: [
    './_blog/*.mdx',
    './components/**/*.tsx',
    './data/**/*.tsx',
    './layouts/**/*.tsx',
    './lib/mdx/mdxComponents.tsx',
    './pages/**/*.{tsx,mdx}',
    './app/**/*.{tsx,ts,js}',
    './../../packages/ui/src/**/*.{tsx,ts,js}',
    './../../packages/ui-patterns/src/**/*.{tsx,ts,js}',
    './../../packages/marketing/src/**/*.{tsx,ts,js}',
  ],
  theme: {
    extend: {
      colors: {
        'purple-sos': {
          100: 'hsl(293 80% 97%)',
          200: 'hsl(293 85% 91%)',
          300: 'hsl(293 90% 80%)',
          400: 'hsl(293 95% 67%)',
          500: 'hsl(293 100% 54%)',
          600: 'hsl(293 100% 44%)',
          700: 'hsl(293 100% 34%)',
          800: 'hsl(293 95% 22%)',
          900: 'hsl(293 90% 12%)',
        },
      },
      keyframes: {
        'flash-code': {
          '0%': { backgroundColor: 'rgba(63, 207, 142, 0.1)' },
          '100%': { backgroundColor: 'transparent' },
        },
        slideIn: {
          '0%': { transform: 'translate3d(0,-100%,0)' },
          '100%': { transform: 'translate3d(0,0,0)' },
        },
        spinner: {
          '0%': {
            transform: 'rotate(0deg)',
          },
          '100%': {
            transform: 'rotate(360deg)',
          },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'marquee-reverse': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0%)' },
        },
        'marquee-vertical': {
          '0%': { transform: 'translateY(0%)' },
          '100%': { transform: 'translateY(-100%)' },
        },
        'pulse-radar': {
          '0%': { transform: 'scale(0)', opacity: 0 },
          '50%': { opacity: 0.8 },
          '100%': { transform: 'scale(100%)', opacity: 0 },
        },
      },
      animation: {
        'flash-code': 'flash-code 1s forwards',
        'flash-code-slow': 'flash-code 2s forwards',
        spinner: 'spinner 1s both infinite',
        marquee: 'marquee 35s linear infinite',
        'marquee-vertical': 'marquee-vertical 180s linear infinite both',
        'pulse-radar': 'pulse-radar 3s linear infinite',
        'slide-in': 'slideIn 250ms ease-in both',
      },
      transitionDelay: {
        1200: '1200ms',
        1500: '1500ms',
      },
    },
  },
})
