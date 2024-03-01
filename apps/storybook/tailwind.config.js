const config = require('config/tailwind.config')
const { fontFamily } = require('tailwindcss/defaultTheme')

module.exports = config({
  content: [
    './../../packages/ui/src/**/*.{tsx,ts,js}',
    './../../packages/ui/src/**/*.*.{tsx,ts,js}',
    './../../packages/ui-patterns/**/*.{tsx,ts,js}',
    './../../packages/ui-patterns/**/*.*.{tsx,ts,js}',
  ],
  // Toggle dark-mode based on .dark class or data-mode="dark"
  // darkMode: ['class', '[data-mode="dark"]'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    // extend: {
    //   colors: {
    //     border: 'hsl(var(--border-overlay))',
    //     input: 'hsl(var(--border-control))',
    //     ring: 'hsl(var(--ring))',
    //     background: 'hsl(var(--background-default))',
    //     foreground: 'hsl(var(--foreground-default))',
    //     primary: {
    //       DEFAULT: 'hsl(var(--foreground-default))',
    //       foreground: 'hsl(var(--background-default))',
    //     },
    //     secondary: {
    //       DEFAULT: 'hsl(var(--secondary))',
    //       foreground: 'hsl(var(--secondary-foreground))',
    //     },
    //     destructive: {
    //       DEFAULT: 'hsl(var(--destructive-default))',
    //       foreground: 'hsl(var(--foreground-default))',
    //     },
    //     muted: {
    //       DEFAULT: 'hsl(var(--border-overlay))',
    //       foreground: 'hsl(var(--foreground-lighter))',
    //     },
    //     accent: {
    //       DEFAULT: 'hsl(var(--background-overlay))',
    //       foreground: 'hsl(var(--foreground-lighter))',
    //     },
    //     popover: {
    //       DEFAULT: 'hsl(var(--background-overlay))',
    //       foreground: 'hsl(var(--foreground-default))',
    //     },
    //     card: {
    //       DEFAULT: 'hsl(var(--background-overlay))',
    //       foreground: 'hsl(var(--foreground-default))',
    //     },
    //   },
    //   borderRadius: {
    //     lg: `var(--radius)`,
    //     md: `calc(var(--radius) - 2px)`,
    //     sm: 'calc(var(--radius) - 4px)',
    //   },
    //   fontFamily: {
    //     sans: ['var(--font-sans)', ...fontFamily.sans],
    //   },
    // },
  },
  plugins: [require('tailwindcss-animate')],
})
