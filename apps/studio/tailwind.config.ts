/* eslint-disable no-restricted-exports */

import tailwindConfig from 'config/tailwind.config'

export default tailwindConfig({
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    // purge styles from grid library
    './../../packages/ui/src/**/*.{tsx,ts,js}',
    './../../packages/ui-patterns/src/**/*.{tsx,ts,js}',
  ],
})
