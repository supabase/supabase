module.exports = {
  future: {
    removeDeprecatedGapUtilities: true,
    purgeLayersByDefault: true,
  },
  purge: {
    mode: 'all',
    content: ['./src/components/**/*.js'],
  },
  // theme: {
  //   extend: {
  //     colors: {
  //       'brand-100': '#7DDAB1',
  //       'brand-200': '#67D4A3',
  //       'brand-300': '#52CD96',
  //       'brand-400': '#3DC688',
  //       'brand-500': '#35B179',
  //       'brand-600': '#2F9A6A',
  //       'brand-700': '#29845B',
  //       'brand-800': '#236E4C',
  //       'brand-900': '#1C583D',
  //     },
  //   },
  // },
  theme: {
    extend: {
      colors: {
        gray: {
          '100': '#eeeeee',
          '200': '#e0e0e0',
          '300': '#bbbbbb',
          '400': '#666666',
          '500': '#444444',
          '600': '#2a2a2a',
          '700': '#1f1f1f',
          '800': '#181818',
          '900': '#0f0f0f',
        },
        'brand-50' : '#aaf3d3',
        'brand-100': '#c5f1dd',
        'brand-200': '#c5f1dd',
        'brand-300': '#9fe7c7',
        'brand-400': '#65d9a5',
        'brand-500': '#24b47e',
        'brand-600': '#38bc81',
        'brand-700': '#1c8656',
        'brand-800': '#10633e',
        'brand-900': '#10633e',
      }
    },
  },


  variants: {
    divideWidth: ['responsive', 'hover', 'focus'],
  },
  plugins: [require('@tailwindcss/ui'), require('@tailwindcss/custom-forms')],
}
