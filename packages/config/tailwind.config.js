// module.exports = {
//   content: [
//     "../../packages/ui/components/**/*.{ts,tsx}",
//     "./src/**/*.{ts,tsx}",
//   ],
//   theme: {
//     extend: {},
//   },
//   plugins: [],
// }

const ui = require('./ui.config.js')
const svgToDataUri = require('mini-svg-data-uri')

module.exports = ui({
  mode: 'JIT',
  content: [
    '../../packages/common/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx,mdx}',
    './components/**/*.tsx',
    './layouts/**/*.tsx',
    './pages/**/*.{tsx,mdx}',
    './_blog/*.mdx',
    // purge styles from supabase ui theme
    '../../node_modules/@supabase/ui/dist/config/default-theme.js',
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
            '--tw-prose-body': theme('colors.scale[1100]'),
            '--tw-prose-headings': theme('colors.scale[1200]'),
            '--tw-prose-lead': theme('colors.scale[1100]'),
            '--tw-prose-links': theme('colors.scale[1100]'),
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
            h2: {
              fontWeight: '400',
            },
            p: {
              fontWeight: '400',
            },
            pre: {
              background: 'none',
              padding: 0,
              marginBottom: '32px',
            },
            'p img': {
              border: '1px solid var(--colors-scale4)',
              borderRadius: '4px',
              overflow: 'hidden',
            },
            iframe: {
              border: '1px solid ' + theme('borderColor.DEFAULT'),
              borderRadius: theme('borderRadius.lg'),
            },
            code: {
              fontWeight: '400',
              padding: '0.2rem 0.4rem',
              backgroundColor: theme('colors.scale[400]'),
              border: '1px solid ' + theme('colors.scale[500]'),
              borderRadius: theme('borderRadius.lg'),
            },
            a: {
              transition: 'box-shadow 0.1s ease-in-out',
              paddingBottom: '2px',
              textDecoration: 'none',
              boxShadow: "theme('colors.brand[900]') 0px -3px 0px -1px inset",
            },
            'a:hover': {
              boxShadow: "inset 0 -30px 0 -1px theme('colors.brand[900]')",
              color: 'var(--tw-prose-headings)',
            },
          },
        },

        toc: {
          css: {
            ul: {
              'list-style-type': 'none',
              'padding-left': 0,
              margin: 0,
              li: {
                'padding-left': 0,
              },
              a: {
                display: 'block',
                marginBottom: '0.4rem',
                'text-decoration': 'none',
                fontSize: '0.8rem',
                fontWeight: '200',
                color: theme('colors.scale[1100]'),
                '&:hover': {
                  color: theme('colors.scale[1200]'),
                },
                'font-weight': '400',
              },
              // margin: 0,
              ul: {
                'list-style-type': 'none',
                li: {
                  marginTop: '0.2rem',
                  marginBottom: '0.2rem',
                  'padding-left': '0 !important',
                  'margin-left': '0.5rem',
                },
                a: {
                  fontWeight: '200',
                  color: theme('colors.scale[1000]'),
                  '&:hover': {
                    color: theme('colors.scale[1200]'),
                  },
                },
              },
            },
          },
        },
      }),
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
      keyframes: {
        'flash-code': {
          '0%': { backgroundColor: 'rgba(63, 207, 142, 0.1)' },
          '100%': { backgroundColor: 'transparent' },
        },
      },
      animation: {
        'flash-code': 'flash-code 1s forwards',
        'flash-code-slow': 'flash-code 2s forwards',
      },
    },
  },
  // variants: {
  //   extend: {
  //     inset: ['group-hover'],
  //     stroke: ['dark'],
  //     height: ['hover'],
  //   },
  // },
  plugins: [require('@tailwindcss/typography')],
})
