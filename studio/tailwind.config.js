const config = require('config/tailwind.config')

module.exports = config({
  content: [
    './../packages/common/**/*.{ts,tsx}',
    './../packages/ui/**/*.{tsx,ts,js}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    './lib/**/**/*.{js,ts,jsx,tsx}',
    './../packages/ui/src/lib/theme/defaultTheme.ts',
    './../packages/ui/src/components/**/*.{ts,tsx}',
    // purge styles from supabase ui theme
    // './../node_modules/ui/dist/config/default-theme.js',
    // purge styles from grid library
    './../node_modules/@supabase/grid/src/components/**/*.{js,ts,jsx,tsx}',
    './../node_modules/@supabase/grid/src/components/**/**/*.{js,ts,jsx,tsx}',
    './internals/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontSize: {
        grid: '13px',
      },
      colors: {
        /*  typography */
        'typography-body': {
          light: 'var(--colors-scale11)',
          dark: 'var(--colors-scale11)',
        },
        'typography-body-secondary': {
          light: 'var(--colors-scale10)',
          dark: 'var(--colors-scale10)',
        },
        'typography-body-strong': {
          light: 'var(--colors-scale12)',
          dark: 'var(--colors-scale12)',
        },
        'typography-body-faded': {
          light: 'var(--colors-scale9)',
          dark: 'var(--colors-scale9)',
        },

        /* Tables */
        'table-body': {
          light: 'var(--colors-scale1)',
          dark: 'var(--colors-scale2)',
        },
        'table-header': {
          light: 'var(--colors-scale2)', // gray[100],
          dark: 'var(--colors-scale3)', // '#1a1a1a', //gray[700],
        },
        'table-footer': {
          light: 'var(--colors-scale2)', // gray[100],
          dark: 'var(--colors-scale4)', // '#1a1a1a',
        },
        'table-border': {
          light: 'var(--colors-scale5)', // gray[100],
          dark: 'var(--colors-scale4)', // '#1a1a1a',
        },

        /* Panels */
        'panel-body': {
          light: 'var(--colors-scale1)',
          dark: 'var(--colors-scale3)',
        },
        'panel-header': {
          light: 'var(--colors-scale1)',
          dark: 'var(--colors-scale3)',
        },
        'panel-footer': {
          light: 'var(--colors-scale1)',
          dark: 'var(--colors-scale3)',
        },
        'panel-border': {
          light: 'var(--colors-scale5)',
          dark: 'var(--colors-scale4)',
        },
        'panel-border-interior': {
          light: 'var(--colors-scale4)',
          dark: 'var(--colors-scale4)',
        },
        'panel-border-hover': {
          light: 'var(--colors-scale2)',
          dark: 'var(--colors-scale4)',
        },
      },

      animation: {
        shimmer: 'shimmer 2s infinite linear',
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
