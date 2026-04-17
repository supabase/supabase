const config = require('config/tailwind.config')

module.exports = config({
  content: [
    './.storybook/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
    // purge styles from grid library
    './../../packages/ui/src/**/*.{tsx,ts,js}',
    './../../packages/ui-patterns/src/**/*.{tsx,ts,js}',
  ],
  plugins: [require('@tailwindcss/container-queries')],
  theme: {
    extend: {},
  },
  plugins: [],
})
