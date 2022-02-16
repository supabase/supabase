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
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './internals/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    './lib/**/**/*.{js,ts,jsx,tsx}',
    './node_modules/@supabase/ui/dist/config/default-theme.js',
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
      DEFAULT: 'var(--colors-scale3)',
      dark: 'var(--colors-scale2)',
    }),
    extend: {
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
          light: 'var(--colors-scale4)', // gray[100],
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
          light: 'var(--colors-scale4)',
          dark: 'var(--colors-scale4)',
        },
        'panel-border-interior': {
          light: 'var(--colors-scale2)',
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
    },
    fontFamily: {
      sans: ['circular', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      mono: ['source code pro', 'Menlo', 'monospace'],
    },
  },
  variants: {
    extend: {},
  },
  // plugins: [],
})
