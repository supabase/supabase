const config = require('config/tailwind.config')

module.exports = config({
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    // purge styles from grid library
    './../../packages/ui/src/**/*.{tsx,ts,js}',
    './../../packages/ui-patterns/src/**/*.{tsx,ts,js}',
  ],
  plugins: [require('@tailwindcss/container-queries')],
  theme: {
    extend: {
      fontSize: {
        grid: '13px',
      },
      colors: {
        /*  typography */
        'typography-body': {
          light: 'hsl(var(--foreground-light))',
          dark: 'hsl(var(--foreground-light))',
        },
        'typography-body-secondary': {
          light: 'hsl(var(--foreground-lighter))',
          dark: 'hsl(var(--foreground-lighter))',
        },
        'typography-body-strong': {
          light: 'hsl(var(--foreground-default))',
          dark: 'hsl(var(--foreground-default))',
        },
        'typography-body-faded': {
          light: 'hsl(var(--foreground-muted))',
          dark: 'hsl(var(--foreground-muted))',
        },

        /* Tables */
        'table-body': {
          light: 'hsl(var(--background-default))',
          dark: 'hsl(var(--background-default))',
        },
        'table-header': {
          light: 'hsl(var(--background-surface-100))',
          dark: 'hsl(var(--background-surface-100))',
        },
        'table-footer': {
          light: 'hsl(var(--background-surface-100))',
          dark: 'hsl(var(--background-surface-100))',
        },
        'table-border': {
          light: 'hsl(var(--border-default))',
          dark: 'hsl(var(--border-default))',
        },

        /* Panels */
        'panel-body': {
          light: 'hsl(var(--background-surface-100))',
          dark: 'hsl(var(--background-surface-100))',
        },
        'panel-header': {
          light: 'hsl(var(--background-surface-100))',
          dark: 'hsl(var(--background-surface-100))',
        },
        'panel-footer': {
          light: 'hsl(var(--background-surface-100))',
          dark: 'hsl(var(--background-surface-100))',
        },
        'panel-border': {
          light: 'hsl(var(--border-default))',
          dark: 'hsl(var(--border-default))',
        },
        'panel-border-interior': {
          light: 'hsl(var(--border-muted))',
          dark: 'hsl(var(--border-muted))',
        },
        'panel-border-hover': {
          light: 'hsl(var(--border-muted))',
          dark: 'hsl(var(--border-muted))',
        },
      },

      animation: {
        shimmer: 'shimmer 2s infinite linear',
        sway: 'sway 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        ellipsis: 'ellipsis 1.5s steps(4, end) infinite',
      },
      keyframes: {
        shimmer: {
          '0%': {
            'background-position': '-1000px 0',
          },
          '100%': {
            'background-position': '1000px 0',
          },
        },
        sway: {
          '0%, 100%': {
            transform: 'rotate(-10deg) scale(1.5) translateY(4rem)',
          },
          '50%': {
            transform: 'rotate(10deg) scale(1.5) translateY(2rem)',
          },
        },
        ellipsis: {
          '0%, 25%': {
            content: '""',
          },
          '26%, 50%': {
            content: '"."',
          },
          '51%, 75%': {
            content: '".."',
          },
          '76%, 100%': {
            content: '"..."',
          },
        },
      },
    },
  },
})
