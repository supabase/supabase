module.exports = {
  future: {
    removeDeprecatedGapUtilities: true,
    purgeLayersByDefault: true,
  },
  purge: {
    mode: 'all',
    content: ['./src/components/**/*.js'],
  },
  theme: {
    extend: {},
  },
  variants: {},
  plugins: [require('@tailwindcss/ui')],
}
