const ui = require('@supabase/ui/dist/config/ui.config.js')

// const gray = {
//   100: '#eeeeee',
//   200: '#e0e0e0',
//   300: '#bbbbbb',
//   400: '#666666',
//   500: '#444444',
//   650: '#333',
//   600: '#2a2a2a',
//   700: '#1f1f1f',
//   800: '#181818',
//   900: '#0f0f0f',
// }
// const green = {
//   100: '#c5f1dd',
//   200: '#c5f1dd',
//   300: '#9fe7c7',
//   400: '#65d9a5',
//   500: '#24b47e',
//   600: '#38bc81',
//   700: '#1c8656',
//   800: '#10633e',
//   900: '#10633e',
// }

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
  purge: [
    // purge styles from app
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './internals/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    './lib/**/**/*.{js,ts,jsx,tsx}',
    // purge styles from supabase ui theme
    './node_modules/@supabase/ui/dist/config/default-theme.js',
    // purge styles from grid library
    './node_modules/@supabase/grid/src/components/**/*.{js,ts,jsx,tsx}',
    './node_modules/@supabase/grid/src/components/**/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    // maxHeight: {
    //   12: '3rem',
    //   48: '12rem',
    // },
    borderColor: (theme) => ({
      ...theme('colors'),
      DEFAULT: 'var(--colors-scale5)',
      dark: 'var(--colors-scale4)',
    }),
    divideColor: (theme) => ({
      ...theme('colors'),
      DEFAULT: 'var(--colors-scale6)',
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
        docs: {
          css: {
            '--tw-prose-body': theme('colors.scale[1100]'),
            '--tw-prose-headings': theme('colors.scale[1200]'),
            '--tw-prose-lead': theme('colors.scale[1100]'),
            '--tw-prose-links': theme('colors.brand[900]'),
            '--tw-prose-bold': theme('colors.scale[1100]'),
            '--tw-prose-counters': theme('colors.scale[1100]'),
            '--tw-prose-bullets': theme('colors.scale[900]'),
            '--tw-prose-hr': theme('colors.scale[500]'),
            '--tw-prose-quotes': theme('colors.scale[1100]'),
            '--tw-prose-quote-borders': theme('colors.scale[500]'),
            '--tw-prose-captions': theme('colors.scale[700]'),
            '--tw-prose-code': theme('colors.scale[1200]'),
            '--tw-prose-pre-code': theme('colors.scale[900]'),
            '--tw-prose-pre-bg': theme('colors.scale[400]'),
            '--tw-prose-th-borders': theme('colors.scale[500]'),
            '--tw-prose-td-borders': theme('colors.scale[200]'),
            '--tw-prose-invert-body': theme('colors.scale[200]'),
            '--tw-prose-invert-headings': theme('colors.white'),
            '--tw-prose-invert-lead': theme('colors.scale[500]'),
            '--tw-prose-invert-links': theme('colors.white'),
            '--tw-prose-invert-bold': theme('colors.white'),
            '--tw-prose-invert-counters': theme('colors.scale[400]'),
            '--tw-prose-invert-bullets': theme('colors.scale[600]'),
            '--tw-prose-invert-hr': theme('colors.scale[700]'),
            '--tw-prose-invert-quotes': theme('colors.scale[100]'),
            '--tw-prose-invert-quote-borders': theme('colors.scale[700]'),
            '--tw-prose-invert-captions': theme('colors.scale[400]'),
            // the following are typography overrides
            // examples can be seen here —> https://github.com/tailwindlabs/tailwindcss-typography/blob/master/src/styles.js
            // reset all header font weights
            'h1, h2, h3, h4, h5': {
              fontWeight: '400',
            },
            // '--tw-prose-invert-code': theme('colors.white'),
            // '--tw-prose-invert-pre-code': theme('colors.scale[900]'),
            // '--tw-prose-invert-pre-bg': 'rgb(0 0 0 / 50%)',
            // '--tw-prose-invert-th-borders': theme('colors.scale[600]'),
            // '--tw-prose-invert-td-borders': theme('colors.scale[700]'),
          },
        },
      }),
      colors: {
        // gray: { ...gray },
        // green: { ...green },
        blueGray: { ...blueGray },
        coolGray: { ...coolGray },

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

        /*  Nav */
        sidebar: {
          // light: 'white',
          // dark: gray[800],
          light: 'var(--colors-scale2)',
          dark: 'var(--colors-scale2)',
        },
        'sidebar-linkbar': {
          // light: 'white',
          // dark: gray[800],
          light: 'var(--colors-scale2)',
          dark: 'var(--colors-scale2)',
        },
        // 'sidebar-active': {
        //   light: 'var(--colors-scale12)',
        //   dark: 'var(--colors-scale2)',
        //   // dark: gray[700],
        // },

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
          // light: blueGray[100],
          // dark: gray[700],
          light: 'var(--colors-scale2)',
          dark: 'var(--colors-scale2)',
        },
        'bg-alt': {
          // light: blueGray[50], // gray[100],
          // dark: gray[600],
          light: 'var(--colors-scale2)',
          dark: 'var(--colors-scale2)',
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

        /* 
          Forms
        */
        // form: {
        //   light: coolGray[600],
        //   dark: gray[200],
        // },

        // 'input-placeholder': {
        //   light: coolGray[300],
        //   dark: gray[400],
        // },
        // 'input-value': {
        //   light: coolGray[600],
        //   dark: gray[200],
        // },
        // 'input-border': {
        //   light: coolGray[300],
        //   dark: gray[500],
        // },
        // 'input-label': {
        //   light: coolGray[600],
        //   dark: gray[200],
        // },
        // 'input-border-hover': {
        //   light: coolGray[400],
        //   dark: gray[400],
        // },
        // 'input-border-focus': {
        //   light: green[300],
        //   dark: green[300],
        // },
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
    fontFamily: {
      sans: ['circular', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      mono: ['source code pro', 'Menlo', 'monospace'],
    },
  },
  variants: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'),
    // ...
  ],
})
