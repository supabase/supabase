const config = require('config/tailwind.config')

module.exports = config({
  content: [
    './../../packages/ui/src/**/*.{tsx,ts,js}',
    './../../packages/ui-patterns/src/**/*.{tsx,ts,js}',
  ],
})
