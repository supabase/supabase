const config = require('config/tailwind.config')

module.exports = config({
  content: [
    './components/**/*.tsx',
    './content/**/*.{ts,tsx,mdx}',
    './docs/**/*.{tsx,mdx}',
    './layouts/**/*.tsx',
    './pages/**/*.{tsx,mdx}',
    './../../packages/ui/src/**/*.{tsx,ts,js}',
    './../../packages/ui-patterns/**/*.{tsx,ts,js}',
  ],
  plugins: [
    function ({ addUtilities, addVariant }) {
      addUtilities({
        // prose (tailwind typography) helpers
        // useful for removing margins in prose styled sections
        '.prose--remove-p-margin p': {
          margin: '0',
        },
      })
    },
    require('@tailwindcss/container-queries'),
  ],
})
