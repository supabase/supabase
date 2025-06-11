const config = require('config/tailwind.config')

module.exports = config({
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './registry/**/*.{js,ts,jsx,tsx}',
    // purge styles from grid library
    //
    './../../packages/ui/src/**/*.{tsx,ts,js}',
    './../../packages/ui-patterns/src/**/*.{tsx,ts,js}',
  ],
  theme: {
    extend: {
      maxWidth: {
        site: '128rem',
      },
    },
  },
})
