const gray = {
  100: '#eeeeee',
  200: '#e0e0e0',
  300: '#bbbbbb',
  400: '#666666',
  500: '#444444',
  650: '#333',
  600: '#2a2a2a',
  700: '#1f1f1f',
  800: '#181818',
  900: '#0f0f0f',
}
const green = {
  100: '#c5f1dd',
  200: '#c5f1dd',
  300: '#9fe7c7',
  400: '#65d9a5',
  500: '#24b47e',
  600: '#38bc81',
  700: '#1c8656',
  800: '#10633e',
  900: '#10633e',
}

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

module.exports = {
  darkMode: 'class', // or 'media' or 'class'
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './internals/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    maxHeight: {
      12: '3rem',
      48: '12rem',
    },
    borderColor: (theme) => ({
      ...theme('colors'),
      DEFAULT: '#f0f2f5',
      dark: theme('colors.gray.600', 'currentColor'),
    }),
    divideColor: (theme) => ({
      ...theme('colors'),
      DEFAULT: '#f0f2f5',
      dark: theme('colors.gray.600', 'currentColor'),
    }),
    extend: {
      colors: {
        gray: { ...gray },
        green: { ...green },
        blueGray: { ...blueGray },
        coolGray: { ...coolGray },

        /*  typography */
        'typography-body': {
          light: coolGray[600],
          dark: gray[100],
        },
        'typography-body-secondary': {
          light: coolGray[500],
          dark: gray[100],
        },
        'typography-body-strong': {
          light: coolGray[100],
          dark: 'white',
        },
        'typography-body-faded': {
          light: coolGray[400],
          dark: gray[300],
        },

        /*  Nav */
        sidebar: {
          light: 'white',
          dark: gray[800],
        },
        'sidebar-linkbar': {
          light: 'white',
          dark: gray[800],
        },
        'sidebar-active': {
          light: blueGray[100],
          dark: '#212121',
          // dark: gray[700],
        },

        /* borders */
        'border-secondary': {
          light: blueGray[100],
          dark: gray[600],
        },
        'border-secondary-hover': {
          light: blueGray[300],
          dark: gray[500],
        },

        /*  app backgrounds */
        'bg-primary': {
          light: 'white',
          dark: gray[800],
        },
        'bg-secondary': {
          light: blueGray[100],
          dark: gray[700],
        },
        'bg-alt': {
          light: blueGray[50], // gray[100],
          dark: gray[600],
        },

        /* Tables */
        'table-body': {
          light: 'white',
          dark: gray[800],
        },
        'table-header': {
          light: blueGray[50], // gray[100],
          dark: gray[700], // '#1a1a1a', //gray[700],
        },
        'table-footer': {
          light: '#f8f9fb', // gray[100],
          dark: '#1a1a1a', //gray[700],
        },
        'table-border': {
          light: '#eff1f4', //gray[100],
          dark: gray[600], // '#222', // gray[600],
        },

        /* Panels */
        'panel-body': {
          light: 'white',
          dark: gray[700], // dark: '#212121', //gray[700],
        },
        'panel-header': {
          light: blueGray[50], // gray[100],
          dark: gray[700], // '#1a1a1a', //gray[700], // dark: '#212121',
        },
        'panel-footer': {
          light: '#f8f9fb', // gray[100],
          dark: gray[700], // '#222', // gray[600], // dark: '#1a1a1a', //gray[700],
        },
        'panel-border': {
          light: '#f0f2f5', //gray[100],
          dark: gray[600], // dark: '#292929', // '#222', // gray[600],
        },
        'panel-border-interior': {
          light: gray[100],
          dark: '#292929', //'#222', // gray[600],
        },
        'panel-border-hover': {
          light: gray[300],
          dark: gray[500],
        },

        /* 
          Forms
        */
        form: {
          light: coolGray[600],
          dark: gray[200],
        },

        'input-placeholder': {
          light: coolGray[300],
          dark: gray[400],
        },
        'input-value': {
          light: coolGray[600],
          dark: gray[200],
        },
        'input-border': {
          light: coolGray[300],
          dark: gray[500],
        },
        'input-label': {
          light: coolGray[600],
          dark: gray[200],
        },
        'input-border-hover': {
          light: coolGray[400],
          dark: gray[400],
        },
        'input-border-focus': {
          light: green[300],
          dark: green[300],
        },
      },
    },
    fontFamily: {
      sans: [
        'circular',
        'BlinkMacSystemFont',
        '-apple-system',
        'Segoe UI',
        'Roboto',
        'Oxygen',
        'Ubuntu',
        'Cantarell',
        'Fira Sans',
        'Droid Sans',
        'Helvetica Neue',
        'Helvetica',
        'Arial',
        'sans-serif',
      ],
      mono: ['source code pro', 'Menlo', 'monospace'],
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
