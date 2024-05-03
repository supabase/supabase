const config = require('config/tailwind.config')
const { fontFamily } = require('tailwindcss/defaultTheme')

module.exports = config({
  content: ['../../packages/ui/**/*.{tsx,ts,js}', '../../packages/ui/**/*.*.{tsx,ts,js}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      keyframes: {
        'flash-code': {
          '0%': { backgroundColor: 'rgba(63, 207, 142, 0.1)' },
          '100%': { backgroundColor: 'transparent' },
        },
        'caret-blink': {
          '0%,70%,100%': { opacity: '1' },
          '20%,50%': { opacity: '0' },
        },
      },
      animation: {
        'flash-code': 'flash-code 1s forwards',
        'flash-code-slow': 'flash-code 2s forwards',
        'caret-blink': 'caret-blink 1.25s ease-out infinite',
      },
      colors: {
        border: 'hsl(var(--border-overlay))',
        input: 'hsl(var(--border-control))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background-default))',
        foreground: 'hsl(var(--foreground-default))',
        primary: {
          DEFAULT: 'hsl(var(--foreground-default))',
          foreground: 'hsl(var(--background-default))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive-default))',
          foreground: 'hsl(var(--foreground-default))',
        },
        muted: {
          DEFAULT: 'hsl(var(--border-overlay))',
          foreground: 'hsl(var(--foreground-lighter))',
        },
        accent: {
          DEFAULT: 'hsl(var(--background-overlay))',
          foreground: 'hsl(var(--foreground-lighter))',
        },
        popover: {
          DEFAULT: 'hsl(var(--background-overlay))',
          foreground: 'hsl(var(--foreground-default))',
        },
        card: {
          DEFAULT: 'hsl(var(--background-overlay))',
          foreground: 'hsl(var(--foreground-default))',
        },
      },
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', ...fontFamily.sans],
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
})
