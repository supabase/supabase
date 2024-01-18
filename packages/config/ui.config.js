const deepMerge = require('deepmerge')
const forms = require('@tailwindcss/forms')
const plugin = require('tailwindcss/plugin')
const radixUiColors = require('@radix-ui/colors')
const brandColors = require('./default-colors')
const svgToDataUri = require('mini-svg-data-uri')

const { default: flattenColorPalette } = require('tailwindcss/lib/util/flattenColorPalette')

// exclude these colors from the included set from Radix
const excludedRadixColors = [
  'bronze',
  'brown',
  'cyan',
  'grass',
  'olive',
  'mauve',
  'mint',
  'lime',
  'plum',
  'sage',
  'sand',
  'sky',
  'teal',
]

// generates fixed scales
// based on the root/light mode version
const fixedOptions = ['scale', 'scaleA']

function radixColorKeys() {
  let keys = Object.keys(radixUiColors)

  /**
   * Filter array items based on search criteria (query)
   */
  function filterItems(arr, query) {
    return arr.filter(function (el) {
      return el.toLowerCase().indexOf(query.toLowerCase()) == -1
    })
  }

  keys = filterItems(keys, 'Dark')

  // remove excluded colors
  keys = keys.filter(
    (key) => !excludedRadixColors.some((excludeColor) => key.startsWith(excludeColor))
  )

  return keys
}

function generateColorClasses() {
  const brandColors = ['scale', 'scaleA']
  const colors = [...radixColorKeys(), ...brandColors]

  let mappedColors = {}

  // generate the shape of the colors object
  colors.map((x) => {
    // create empty obj for each color
    mappedColors[x] = {}
    // create empty obj for each fixed color
    if (fixedOptions.some((v) => x.indexOf(v) >= 0)) {
      mappedColors[`${x}-fixed`] = {}
    }
  })

  colors.map((x) => {
    for (let index = 0; index < 12; index++) {
      const step = index + 1
      mappedColors[x][step * 100] = `var(--colors-${x}${step})`

      if (fixedOptions.some((v) => x.indexOf(v) >= 0)) {
        mappedColors[`${x}-fixed`][step * 100] = `var(--colors-fixed-${x}${step})`
      }
    }
  })

  return mappedColors
}

const colorClasses = generateColorClasses()

// generate the CSS variables for tailwind to use
function generateCssVariables() {
  // potential options
  // { fixedOptions, brandColors }

  let rootColors = {}
  let darkColors = {}

  const radixArray = Object.entries(radixUiColors)
    .filter(
      ([key, value]) => !excludedRadixColors.some((excludeColor) => key.startsWith(excludeColor))
    )
    .map(([, value]) => value)

  const brandArray = Object.values(brandColors)

  function generateColors(colors, index, colorSet) {
    const key = Object.keys(colorSet)[index]

    if (key.includes('Dark')) {
      darkColors = { ...darkColors, ...colors }
    } else {
      rootColors = { ...rootColors, ...colors }

      // generate an optional 'fixed' scale of colors
      if (
        fixedOptions.some(function (v) {
          return key.indexOf(v) >= 0
        })
      ) {
        rootColors.fixed = { ...rootColors?.fixed, ...colors }
      }
    }
  }

  radixArray.map((x, i) => {
    generateColors(x, i, radixUiColors)
  })

  brandArray.map((x, i) => {
    generateColors(x, i, brandColors)
  })

  return {
    root: { ...rootColors },
    dark: { ...darkColors },
  }
}

const variables = generateCssVariables()

const uiConfig = {
  theme: {
    variables: {
      DEFAULT: {
        width: {
          listbox: '320px',
        },
        colors: { ...variables.root },
      },
      "[data-theme*='dark']": {
        colors: { ...variables.dark },
      },
    },
    extend: {
      // dropdown extensions
      transformOrigin: {
        // tailwind class for this is `origin-dropdown`
        dropdown: 'var(--radix-dropdown-menu-content-transform-origin)',
        popover: 'var(--radix-popover-menu-content-transform-origin);',
      },
      width: {
        listbox: 'var(--width-listbox);',
      },
      keyframes: {
        fadeIn: {
          '0%': { transform: 'scale(0.95)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
        fadeOut: {
          '0%': { transform: 'scale(1)', opacity: 1 },
          '100%': { transform: 'scale(0.95)', opacity: 0 },
        },
        overlayContentShow: {
          '0%': { opacity: 0, transform: 'translate(0%, -2%) scale(.96)' },
          '100%': { opacity: 1, transform: 'translate(0%, 0%) scale(1)' },
        },
        overlayContentHide: {
          '0%': { opacity: 1, transform: 'translate(0%, 0%) scale(1)' },
          '100%': { opacity: 0, transform: 'translate(0%, -2%) scale(.96)' },
        },
        dropdownFadeIn: {
          '0%': { transform: 'scale(0.95)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
        dropdownFadeOut: {
          '0%': { transform: 'scale(1)', opacity: 1 },
          '100%': { transform: 'scale(0.95)', opacity: 0 },
        },
        fadeInOverlayBg: {
          '0%': { opacity: 0 },
          '100%': { opacity: 0.75 },
        },
        fadeOutOverlayBg: {
          '0%': { opacity: 0.75 },
          '100%': { opacity: 0 },
        },
        slideDown: {
          '0%': { height: 0, opacity: 0 },
          '100%': {
            height: 'var(--radix-accordion-content-height)',
            opacity: 1,
          },
        },
        slideUp: {
          '0%': { height: 'var(--radix-accordion-content-height)', opacity: 1 },
          '100%': { height: 0, opacity: 0 },
        },

        slideDownNormal: {
          '0%': { height: 0, opacity: 0 },
          '100%': {
            height: 'inherit',
            opacity: 1,
          },
        },
        slideUpNormal: {
          '0%': { height: 'inherit', opacity: 1 },
          '100%': { height: 0, opacity: 0 },
        },

        panelSlideLeftOut: {
          '0%': { transform: 'translateX(-100%)', opacity: 0 },
          '100%': {
            transform: 'translate-x-0',
            opacity: 1,
          },
        },
        panelSlideLeftIn: {
          '0%': { transform: 'translate-x-0', opacity: 1 },
          '100%': { transform: 'translateX(-100%)', opacity: 0 },
        },
        panelSlideRightOut: {
          '0%': { transform: 'translateX(100%)', opacity: 0 },
          '100%': {
            transform: 'translate-x-0',
            opacity: 1,
          },
        },
        panelSlideRightIn: {
          '0%': { transform: 'translate-x-0', opacity: 1 },
          '100%': { transform: 'translateX(100%)', opacity: 0 },
        },
        lineLoading: {
          '0%': {
            marginLeft: '-10%',
            width: '80px',
          },
          '25%': {
            width: ' 240px',
          },
          '50%': {
            marginLeft: '100%',
            width: '80px',
          },
          '75%': {
            width: '240px',
          },
          '100%': {
            marginLeft: '-10%',
            width: '80px',
          },
        },
      },
      animation: {
        'fade-in': 'fadeIn 300ms both',
        'fade-out': 'fadeOut 300ms both',

        'dropdown-content-show': 'overlayContentShow 100ms cubic-bezier(0.16, 1, 0.3, 1)',
        'dropdown-content-hide': 'overlayContentHide 100ms cubic-bezier(0.16, 1, 0.3, 1)',

        'overlay-show': 'overlayContentShow 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        'overlay-hide': 'overlayContentHide 300ms cubic-bezier(0.16, 1, 0.3, 1)',

        'fade-in-overlay-bg': 'fadeInOverlayBg 300ms',
        'fade-out-overlay-bg': 'fadeOutOverlayBg 300ms',

        'slide-down': 'slideDown 300ms cubic-bezier(0.87, 0, 0.13, 1)',
        'slide-up': 'slideUp 300ms cubic-bezier(0.87, 0, 0.13, 1)',

        'slide-down-normal': 'slideDownNormal 300ms cubic-bezier(0.87, 0, 0.13, 1)',
        'slide-up-normal': 'slideUpNormal 300ms cubic-bezier(0.87, 0, 0.13, 1)',

        'panel-slide-left-out': 'panelSlideLeftOut 200ms cubic-bezier(0.87, 0, 0.13, 1)',
        'panel-slide-left-in': 'panelSlideLeftIn 250ms cubic-bezier(0.87, 0, 0.13, 1)',
        'panel-slide-right-out': 'panelSlideRightOut 200ms cubic-bezier(0.87, 0, 0.13, 1)',
        'panel-slide-right-in': 'panelSlideRightIn 250ms cubic-bezier(0.87, 0, 0.13, 1)',

        'line-loading': 'lineLoading 1.8s infinite',
        'line-loading-slower': 'lineLoading 2.3s infinite',

        // tailwind class for this is `animate-dropdownFadeIn`
        dropdownFadeIn: 'dropdownFadeIn 0.1s ease-out',
        // tailwind class for this is `animate-dropdownFadeOut`
        dropdownFadeOut: 'dropdownFadeOut 0.1s ease-out',
      },
      colors: {
        ...colorClasses,
        'hi-contrast': `hsl(var(--foreground-default))`,
        'lo-contrast': `hsl(var(--background-alternative-default))`,
        warning: {
          default: 'red',
          100: '#342355',
        },
      },
    },
  },
  plugins: [
    require('@mertasan/tailwindcss-variables'),
    function ({ addUtilities, addVariant }) {
      // addVariant('data-open', '&:[data-state=open]')
      addUtilities({
        '.line-loading-bg': {
          background: 'rgb(0, 0, 0)',
          background:
            'linear-gradient(90deg,rgba(0, 0, 0, 0) 0%,rgba(255, 255, 255, 0.65) 50%,rgba(0, 0, 0, 0) 100%)',
        },
        '.line-loading-bg-light': {
          background: 'rgb(0, 0, 0)',
          background:
            'linear-gradient(90deg,rgba(0, 0, 0, 0) 0%,rgba(33, 33, 33, 0.65) 50%,rgba(0, 0, 0, 0) 100%)',
        },
        ".dropdown-content[data-state='open']": {
          animation: 'fadeIn 50ms ease-out',
        },
        ".dropdown-content[data-state='closed']": {
          animation: 'fadeOut 50ms ease-in',
        },
        "[data-state='open'] .accordion-content-animation": {
          animation: 'slideDown 200ms ease-out',
        },
        "[data-state='closed'] .accordion-content-animation": {
          animation: 'slideUp 200ms ease-in',
        },
        '.text-code': {
          margin: '0 0.2em',
          padding: '0.2em 0.4em 0.1em',
          background: 'hsla(0, 0%, 58.8%, 0.1)',
          border: '1px solid hsla(0, 0%, 39.2%, 0.2)',
          borderRadius: '3px',
        },
        '.no-scrollbar': {
          /* Hide scrollbar for IE, Edge*/
          '-ms-overflow-style': 'none',

          /* Firefox */
          'scrollbar-width': 'none' /* Firefox */,

          /* Hide scrollbar for Chrome, Safari and Opera */
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        /* Add fadeout effect */
        '.mask-fadeout-right': {
          '-webkit-mask-image': 'linear-gradient(to right, white 98%, transparent 100%)',
          'mask-image': 'linear-gradient(to right, white 98%, transparent 100%)',
        },
        '.mask-fadeout-left': {
          '-webkit-mask-image': 'linear-gradient(to left, white 98%, transparent 100%)',
          'mask-image': 'linear-gradient(to left, white 98%, transparent 100%)',
        },
        'input[type="number"]::-webkit-outer-spin-button, input[type="number"]::-webkit-inner-spin-button':
          {
            '-webkit-appearance': 'none',
            margin: '0',
          },
      })
      addVariant('data-open-parent', '[data-state="open"] &')
      addVariant('data-closed-parent', '[data-state="closed"] &')
      addVariant('data-open', '&[data-state="open"]')
      addVariant('data-closed', '&[data-state="closed"]')
      addVariant('data-show', '&[data-state="show"]')
      addVariant('data-hide', '&[data-state="hide"]')
      addVariant('data-checked', '&[data-state="checked"]')
      addVariant('data-unchecked', '&[data-state="unchecked"]')
      addVariant('aria-expanded', '&[aria-expanded="true"]')
      // addVariant('parent-data-open', '[data-state="open"]&')
    },
    function ({ matchUtilities, theme }) {
      matchUtilities(
        {
          highlight: (value) => ({ boxShadow: `inset 0 1px 0 0 ${value}` }),
        },
        { values: flattenColorPalette(theme('backgroundColor')), type: 'color' }
      )
      matchUtilities(
        {
          subhighlight: (value) => ({
            boxShadow: `inset 0 -1px 0 0 ${value}`,
          }),
        },
        {
          values: flattenColorPalette(theme('backgroundColor')),
          type: 'color',
        }
      )
      matchUtilities(
        {
          'bg-grid': (value) => ({
            backgroundImage: `url("${svgToDataUri(
              `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="${value}"><path d="M0 .5H31.5V32"/></svg>`
            )}")`,
          }),
        },
        { values: flattenColorPalette(theme('backgroundColor')), type: 'color' }
      )
    },
    require('tailwindcss-radix')(),
    forms,
  ],
}

function arrayMergeFn(destinationArray, sourceArray) {
  return destinationArray.concat(sourceArray).reduce((acc, cur) => {
    if (acc.includes(cur)) return acc
    return [...acc, cur]
  }, [])
}

/**
 * Merge Supabase UI and Tailwind CSS configurations
 * @param {object} tailwindConfig - Tailwind config object
 * @return {object} new config object
 */
function wrapper(tailwindConfig) {
  let purge
  if (Array.isArray(tailwindConfig.purge)) {
    purge = {
      content: tailwindConfig.purge,
    }
  } else {
    purge = tailwindConfig.purge
  }
  return deepMerge({ ...tailwindConfig, purge }, uiConfig, {
    arrayMerge: arrayMergeFn,
  })
}

module.exports = wrapper
