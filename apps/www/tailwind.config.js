const config = require('config/tailwind.config')

const extend = {
  colors: {
    'auth-widget': {
      brand: 'var(--colors-brand)',
      label: 'var(--colors-brand)',
      input: 'var(--colors-inputText)',
    },
  },
}

module.exports = config(extend)
