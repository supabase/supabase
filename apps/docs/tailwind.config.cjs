const config = require('config/tailwind.config')

module.exports = config({
  content: [
    './app/**/*.{ts,tsx,mdx}',
    './components/**/*.tsx',
    './content/**/*.{ts,tsx,mdx}',
    './docs/**/*.{tsx,mdx}',
    './features/**/*.{ts,tsx,mdx}',
    './layouts/**/*.tsx',
    './pages/**/*.{tsx,mdx}',
    './../../packages/ui/src/**/*.{tsx,ts,js}',
    './../../packages/ui-patterns/src/**/*.{tsx,ts,js}',
  ],
})
