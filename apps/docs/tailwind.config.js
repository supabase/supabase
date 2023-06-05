const config = require('config/tailwind.config')

module.exports = config({
  content: [
    './../../packages/common/**/*.{ts,tsx}',
    './../../packages/ui/**/*.{tsx,ts,js}',
    './pages/**/*.{tsx,mdx}',
    './components/**/*.tsx',
    './layouts/**/*.tsx',
    './src/**/*.{ts,tsx,mdx}',
    './docs/**/*.{tsx,mdx}',
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
  ],
})
