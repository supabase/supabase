const ui = require('@supabase/ui/dist/config/ui.config.js')

const blueGray = {
  50: '#F8FAFC',
  100: '#F1F5F9',
  200: '#E2E8F0',
  300: '#CBD5E1',
  400: '#94A3B8',
  500: '#64748B',
  600: '#475569',
  700: '#334155',
  800: '#1E293B',
  900: '#0F172A',
}

const coolGray = {
  50: '#F9FAFB',
  100: '#F3F4F6',
  200: '#E5E7EB',
  300: '#D1D5DB',
  400: '#9CA3AF',
  500: '#6B7280',
  600: '#4B5563',
  700: '#374151',
  800: '#1F2937',
  900: '#111827',
}

module.exports = ui({
  darkMode: 'class', // or 'media' or 'class'
  content: [
    // purge styles from app
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './internals/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    './lib/**/**/*.{js,ts,jsx,tsx}',
    // purge styles from supabase ui theme
    './node_modules/@supabase/ui/dist/config/default-theme.js',
  ],
  theme: {
    fontFamily: {
      sans: ['circular', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      mono: ['source code pro', 'Menlo', 'monospace'],
    },
    borderColor: (theme) => ({
      ...theme('colors'),
      DEFAULT: 'var(--colors-scale5)',
      dark: 'var(--colors-scale4)',
    }),
    divideColor: (theme) => ({
      ...theme('colors'),
      DEFAULT: 'var(--colors-scale3)',
      dark: 'var(--colors-scale2)',
    }),
    extend: {
      typography: ({ theme }) => ({
        // Removal of backticks in code blocks for tailwind v3.0
        // https://github.com/tailwindlabs/tailwindcss-typography/issues/135
        DEFAULT: {
          css: {
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
          },
        },
      }),
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

        /* borders */
        'border-secondary': {
          light: 'var(--colors-scale7)',
          dark: 'var(--colors-scale7)',
        },
        'border-secondary-hover': {
          light: 'var(--colors-scale9)',
          dark: 'var(--colors-scale9)',
        },

        /*  app backgrounds */
        'bg-primary': {
          light: 'var(--colors-scale2)',
          dark: 'var(--colors-scale2)',
        },
        'bg-secondary': {
          light: 'var(--colors-scale2)',
          dark: 'var(--colors-scale2)',
        },
        'bg-alt': {
          light: 'var(--colors-scale2)',
          dark: 'var(--colors-scale2)',
        },
      },
      animation: {
        gradient: 'gradient 60s ease infinite',
        'ping-once': 'ping-once 1s cubic-bezier(0, 0, 0.2, 1);',
      },
      keyframes: {
        gradient: {
          '0%': {
            'background-position': '0% 50%',
          },
          '50%': {
            'background-position': '100% 50%',
          },
          '100%': {
            'background-position': '0% 50%',
          },
        },
        'ping-once': {
          '75%': {
            transform: 'scale(2)',
            opacity: 0,
          },
          '100%': {
            transform: 'scale(2)',
            opacity: 0,
          },
        },
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [require('@tailwindcss/typography')],
})
