module.exports = {
  future: {
    removeDeprecatedGapUtilities: true,
    purgeLayersByDefault: true,
    standardFontWeights: true,
    defaultLineHeights: true,
  },
  purge: ['./src/**/*.svelte', './src/**/*.html'],
  theme: {
    extend: {
      colors: {
        orange: {
          500: '#ff3e00',
        },
      },
    },
  },
  variants: {},
  plugins: [],
}
