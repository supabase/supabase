const config = require('config/tailwind.config')
// const { fontFamily } = require('tailwindcss/defaultTheme')

module.exports = config({
  content: [
    './../../packages/ui/src/**/*.{tsx,ts,js}',
    './../../packages/ui/src/**/*.*.{tsx,ts,js}',
    './../../packages/ui-patterns/**/*.{tsx,ts,js}',
    './../../packages/ui-patterns/**/*.*.{tsx,ts,js}',
  ],
  // Toggle dark-mode based on .dark class or data-mode="dark"
  // darkMode: ['class', '[data-mode="dark"]']
  plugins: [require('tailwindcss-animate')],
})
