module.exports = {
  purge: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './layouts/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    borderColor: (theme) => ({
      ...theme('colors'),
      DEFAULT: '#f0f2f5',
      dark: theme('colors.gray.600', 'currentColor'),
    }),
    extend: {
      colors: {
        brand: {
          100: '#82dab0',
          200: '#69d3a0',
          300: '#50cb90',
          400: '#C5F1DD',
          500: '#9FE7C7',
          600: '#65D9A5',
          700: '#3ECF8E',
          800: '#38BC81',
          900: '#10633E',
        },
        dark: {
          100: '#eeeeee',
          200: '#e0e0e0',
          300: '#bbbbbb',
          400: '#666666',
          500: '#444444',
          600: '#2a2a2a',
          700: '#1f1f1f',
          800: '#181818',
          900: '#0f0f0f',
        },
        gray: {
          100: '#eeeeee',
          200: '#e0e0e0',
          300: '#bbbbbb',
          400: '#666666',
          500: '#444444',
          600: '#2a2a2a',
          700: '#1f1f1f',
          800: '#181818',
          900: '#0f0f0f',
        },
      },
      fontSize: {
        "tiny": "0.6rem",
      },
      typography(theme) {
        return {
          DEFAULT: {
            css: {
              // color: theme('colors.gray.800'),
              pre: {
                color: theme('colors.gray.200'),
                padding: 0,
                backgroundColor: 'transparent',
                marginTop: 0,
              },

              // ...
            },
          },
          dark: {
            css: {
              color: theme('colors.gray.300'),
              '[class~="lead"]': { color: theme('colors.gray.400') },
              a: { color: theme('colors.gray.100') },
              strong: { color: theme('colors.gray.100') },
              'ul > li::before': { backgroundColor: theme('colors.gray.700') },
              hr: { borderColor: theme('colors.gray.800') },
              blockquote: {
                color: theme('colors.gray.100'),
                borderLeftColor: theme('colors.gray.800'),
              },
              h1: { color: theme('colors.gray.300') },
              h2: { color: theme('colors.gray.300') },
              h3: { color: theme('colors.gray.300') },
              h4: { color: theme('colors.gray.300') },
              code: { color: theme('colors.gray.300') },
              'a code': { color: theme('colors.gray.300') },
              // pre: {
              //   color: theme('colors.gray.200'),
              //   backgroundColor: theme('colors.gray.800'),
              // },
              thead: {
                color: theme('colors.gray.100'),
                borderBottomColor: theme('colors.gray.700'),
              },
              'tbody tr': { borderBottomColor: theme('colors.gray.800') },
            },
          },
        }
      },
    },
  },
  variants: {
    extend: { typography: ['dark'] },
  },
  plugins: [require('@tailwindcss/typography')],
}
