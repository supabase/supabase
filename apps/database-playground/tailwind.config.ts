import config from 'config/tailwind.config'

export default config({
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{tsx,ts,js}',
    '../../packages/ui-patterns/**/*.{tsx,ts,js}',
  ],
})
