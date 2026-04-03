const config = require('config/tailwind.config')

/** @type {import('tailwindcss').Config} */
export default config({
  content: [
    './app/**/*.{ts,tsx}',
    './../../packages/ui/src/**/*.{tsx,ts,js}',
    './../../packages/ui-patterns/src/**/*.{tsx,ts,js}',
  ],
  theme: {
    extend: {},
  },
})
