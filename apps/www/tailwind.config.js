const config = require('config/tailwind.config')

module.exports = config({
  content: [
    './_blog/*.mdx',
    './components/**/*.tsx',
    './data/**/*.tsx',
    './layouts/**/*.tsx',
    './lib/mdx/mdxComponents.tsx',
    './pages/**/*.{tsx,mdx}',
    './app/**/*.{tsx,ts,js}',
    './../../packages/ui/src/**/*.{tsx,ts,js}',
    './../../packages/ui-patterns/src/**/*.{tsx,ts,js}',
    './../../packages/marketing/src/**/*.{tsx,ts,js}',
  ],
})
