module.exports = {
  purge: ['./components/**/*.tsx', './pages/**/*.tsx'],
  darkMode: 'media', // 'media' or 'class'
  theme: {
    extend: {
      screens: {
        'sm': '640px',
        // => @media (min-width: 640px) { ... }
  
        'md': '768px',
        // => @media (min-width: 768px) { ... }
  
        'lg': '1024px',
        // => @media (min-width: 1024px) { ... }
  
        'xl': '1280px',
        // => @media (min-width: 1280px) { ... }
  
        '2xl': '1536px',
        // => @media (min-width: 1536px) { ... }
      },
      colors: {
        'accent-1': '#FAFAFA',
        'accent-2': '#EAEAEA',
        'accent-7': '#333',
        success: '#0070f3',
        cyan: '#79FFE1',
        brand: {
          '100': '#7DDAB1',
          '200': '#67D4A3',
          '300': '#52CD96',
          '400': '#3DC688',
          '500': '#35B179',
          '600': '#24b47e',
          '700': '#29845B',
          '800': '#236E4C',
          '900': '#1C583D',
        },
        dark: {
          100: '#202020'
        }
      },
      spacing: {
        28: '7rem',
      },
      letterSpacing: {
        tighter: '-.04em',
      },
      lineHeight: {
        tight: 1.2,
      },
      fontSize: {
        '5xl': '2.5rem',
        '6xl': '2.75rem',
        '7xl': '4.5rem',
        '8xl': '6.25rem',
      },
      boxShadow: {
        small: '0 5px 10px rgba(0, 0, 0, 0.12)',
        medium: '0 8px 30px rgba(0, 0, 0, 0.12)',
      },
      fontFamily: {
        sans: [
          'Circular Std',
          'Circular',
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
        mono: ['Source Code Pro', 'Menlo', 'monospace'],
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
