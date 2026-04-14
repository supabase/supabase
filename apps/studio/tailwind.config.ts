/* eslint-disable no-restricted-exports */

import containerQueries from '@tailwindcss/container-queries'
import tailwindConfig from 'config/tailwind.config'

export default tailwindConfig({
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    // purge styles from grid library
    './../../packages/ui/src/**/*.{tsx,ts,js}',
    './../../packages/ui-patterns/src/**/*.{tsx,ts,js}',
  ],
  plugins: [containerQueries],
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
        'badge-shimmer': 'badge-shimmer 3s ease-in-out infinite',
        'badge-pulse': 'badge-pulse 3s ease-in-out infinite',
        'chevron-up': 'chevron-up 2s ease-in-out infinite',
        sway: 'sway 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
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
        'badge-shimmer': {
          '0%': { transform: 'rotate(-45deg) translateX(-100%)', opacity: '0' },
          '10%': { opacity: '1' },
          '40%': { opacity: '1' },
          '50%': { transform: 'rotate(-45deg) translateX(100%)', opacity: '0' },
          '100%': { transform: 'rotate(-45deg) translateX(100%)', opacity: '0' },
        },
        'badge-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        'chevron-up': {
          '0%, 100%': { opacity: '0.2' },
          '50%': { opacity: '1' },
        },
        sway: {
          '0%, 100%': {
            transform: 'rotate(-10deg) scale(1.5) translateY(4rem)',
          },
          '50%': {
            transform: 'rotate(10deg) scale(1.5) translateY(2rem)',
          },
        },
      },
    },
  },
})
