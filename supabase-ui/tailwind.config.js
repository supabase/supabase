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
    extend: {
      colors: {
        'brand-100': '#7DDAB1',
        'brand-200': '#67D4A3',
        'brand-300': '#52CD96',
        'brand-400': '#3DC688',
        'brand-500': '#35B179',
        'brand-600': '#2F9A6A',
        'brand-700': '#29845B',
        'brand-800': '#236E4C',
        'brand-900': '#1C583D',
      },
    },
  },
  variants: {},
  plugins: [require('@tailwindcss/ui'), require('@tailwindcss/custom-forms')],
}
