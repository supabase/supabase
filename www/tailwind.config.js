const ui = require('./ui.config.js')
const svgToDataUri = require('mini-svg-data-uri')

module.exports = ui({
  mode: 'JIT',
  purge: [
    './components/**/*.tsx',
    './pages/**/*.tsx',
    './_blog/*.mdx',
    // purge styles from supabase ui theme
    './node_modules/@supabase/ui/dist/config/default-theme.js',
  ],
  darkMode: 'class', // 'media' or 'class'
  // mode: 'jit',
  theme: {
    borderColor: (theme) => ({
      ...theme('colors'),
      DEFAULT: theme('colors.scale.300', 'currentColor'),
      dark: theme('colors.scale.1200', 'currentColor'),
    }),
    divideColor: (theme) => ({
      ...theme('colors'),
      DEFAULT: theme('colors.scale.300', 'currentColor'),
      dark: theme('colors.scale.600', 'currentColor'),
    }),
    extend: {
      // screens: {
      //   sm: '640px',
      //   // => @media (min-width: 640px) { ... }
      //   md: '768px',
      //   // => @media (min-width: 768px) { ... }
      //   lg: '1024px',
      //   // => @media (min-width: 1024px) { ... }
      //   xl: '1280px',
      //   // => @media (min-width: 1280px) { ... }
      //   '2xl': '1536px',
      //   // => @media (min-width: 1536px) { ... }
      // },
      // colors: {
      //   'gray-light': '#7B7F86',
      //   'gray-dark': '#7B7F86',
      //   'accent-1': '#FAFAFA',
      //   'accent-2': '#EAEAEA',
      //   'accent-7': '#333',
      //   success: '#0070f3',
      //   cyan: '#79FFE1',
      //   // brand: {
      //   //   100: '#82dab0',
      //   //   200: '#69d3a0',
      //   //   300: '#50cb90',
      //   //   400: '#C5F1DD',
      //   //   500: '#9FE7C7',
      //   //   600: '#65D9A5',
      //   //   700: '#3ECF8E',
      //   //   800: '#38BC81',
      //   //   900: '#10633E',
      //   // },
      //   // Joshen TODO: At the end just rearrange the values
      //   dark: {
      //     100: '#eeeeee',
      //     200: '#e0e0e0',
      //     300: '#bbbbbb',
      //     400: '#666666',
      //     500: '#444444',
      //     600: '#2a2a2a',
      //     700: '#1f1f1f',
      //     800: '#181818',
      //     900: '#0f0f0f',
      //   },
      //   // gray: {
      //   //   100: '#eeeeee',
      //   //   200: '#e0e0e0',
      //   //   300: '#bbbbbb',
      //   //   400: '#666666',
      //   //   500: '#444444',
      //   //   600: '#2a2a2a',
      //   //   700: '#1f1f1f',
      //   //   800: '#181818',
      //   //   900: '#0f0f0f',
      //   // },
      // },
      // spacing: {
      //   28: '7rem',
      // },
      // letterSpacing: {
      //   tighter: '-.04em',
      // },
      // lineHeight: {
      //   tight: 1.2,
      // },
      // fontSize: {
      //   '5xl': '2.5rem',
      //   '6xl': '2.75rem',
      //   '7xl': '4.5rem',
      //   '8xl': '6.25rem',
      // },
      // boxShadow: {
      //   'light-small': '0px 4px 8px 2px rgba(107, 114, 128, 0.08)',
      //   small: '0 5px 10px rgba(0, 0, 0, 0.12)',
      //   medium: '0 8px 30px rgba(0, 0, 0, 0.12)',
      //   override: '0px 0px 0px rgba(0, 0, 0, 0)',
      // },
      fontFamily: {
        sans: ['custom-font', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['Source Code Pro', 'Menlo', 'monospace'],
      },
      // stroke: (theme) => ({
      //   white: theme('colors.white'),
      //   black: theme('colors.black'),
      // }),
      backgroundImage: (theme) => ({
        squiggle: `url("${svgToDataUri(
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 6 3" enable-background="new 0 0 6 3" width="6" height="3" fill="${theme(
            'colors.yellow.400'
          )}"><polygon points="5.5,0 2.5,3 1.1,3 4.1,0"/><polygon points="4,0 6,2 6,0.6 5.4,0"/><polygon points="0,2 1,3 2.4,3 0,0.6"/></svg>`
        )}")`,
      }),
    },
  },
  // variants: {
  //   extend: {
  //     inset: ['group-hover'],
  //     stroke: ['dark'],
  //     height: ['hover'],
  //   },
  // },
  plugins: [],
})
