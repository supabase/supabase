const ui = require('./ui.config.js')
const deepMerge = require('deepmerge')

const color = require('./../ui/build/css/tw-extend/color')

/**
 *
 */
let colorExtend = {}
Object.values(color).map((x, i) => {
  colorExtend[Object.keys(color)[i]] = `hsl(${x.cssVariable} / <alpha-value>)` // x.cssVariable
})

// console.log('colorExtend', colorExtend)
// console.log('colorExtend kebabToNested', kebabToNested(colorExtend))

// console.log('colorExtend', kebabToNested(colorExtend).colors.gray)

/**
 * Generates Tailwind colors for the theme
 * adds <alpha-value> as part of the hsl value
 */
function generateTwColorClasses(globalKey, twAttributes) {
  let classes = {}
  Object.values(twAttributes).map((attr, i) => {
    const attrKey = Object.keys(twAttributes)[i]

    if (attrKey.includes(globalKey)) {
      const keySplit = attrKey.split('-').splice(1).join('-')

      let payload = {
        [keySplit]: `hsl(${attr.cssVariable} / <alpha-value>)`,
      }

      if (keySplit == 'DEFAULT') {
        // includes a 'default' duplicate
        // this allows for classes like `border-default` which is the same as `border`
        payload = {
          ...payload,
          default: `hsl(${attr.cssVariable} / <alpha-value>)`,
        }
      }

      classes = {
        ...classes,
        ...payload,
      }
    }
  })
  /**
   * mutate object into nested object for tailwind theme structure
   */
  const nestedClasses = kebabToNested(classes)
  // return, but nest the keys if they are kebab case named
  return nestedClasses
}

/**
 * Helper to convert kebab named keys in object to nested nodes
 */
function kebabToNested(obj) {
  const result = {}
  for (const [key, value] of Object.entries(obj)) {
    const parts = key.split('-')
    let currentObj = result
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i] === 'DEFAULT' ? parts[i] : parts[i].toLowerCase() // convert key to lowercase
      if (!currentObj[part]) {
        currentObj[part] = {}
      }
      if (i === parts.length - 1) {
        if (typeof value === 'object') {
          currentObj[part] = kebabToNested(value) // recursively convert nested objects
        } else {
          currentObj[part] = value.toString().toLowerCase() // convert value to lowercase
        }
      } else {
        currentObj = currentObj[part]
      }
    }
  }
  return result
}

/**
 * Main theme config
 */
const uiConfig = ui({
  mode: 'JIT',
  darkMode: 'class',
  theme: {
    /**
     * Spread all theme colors and custom generated colors into theme
     */
    textColor: (theme) => ({
      ...theme('colors'),
      ...generateTwColorClasses('foreground', color),
    }),
    backgroundColor: (theme) => ({
      ...theme('colors'),
      ...generateTwColorClasses('background', color),
    }),
    borderColor: (theme) => ({
      ...theme('colors'),
      ...generateTwColorClasses('border', color),
    }),
    extend: {
      colors: {
        ...kebabToNested(colorExtend),
      },

      typography: ({ theme }) => ({
        // Removal of backticks in code blocks for tailwind v3.0
        // https://github.com/tailwindlabs/tailwindcss-typography/issues/135
        DEFAULT: {
          css: {
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            '--tw-prose-body': theme('colors.scale[1100]'),
            '--tw-prose-headings': theme('colors.scale[1200]'),
            '--tw-prose-lead': theme('colors.scale[1100]'),
            '--tw-prose-links': theme('colors.scale[1100]'),
            '--tw-prose-bold': theme('colors.scale[1100]'),
            '--tw-prose-counters': theme('colors.scale[1100]'),
            '--tw-prose-bullets': theme('colors.scale[900]'),
            '--tw-prose-hr': theme('colors.scale[500]'),
            '--tw-prose-quotes': theme('colors.scale[1100]'),
            '--tw-prose-quote-borders': theme('colors.scale[500]'),
            '--tw-prose-captions': theme('colors.scale[700]'),
            '--tw-prose-code': theme('colors.scale[1200]'),
            '--tw-prose-pre-code': theme('colors.scale[900]'),
            '--tw-prose-pre-bg': theme('colors.scale[400]'),
            '--tw-prose-th-borders': theme('colors.scale[500]'),
            '--tw-prose-td-borders': theme('colors.scale[200]'),
            '--tw-prose-invert-body': theme('colors.scale[200]'),
            '--tw-prose-invert-headings': theme('colors.white'),
            '--tw-prose-invert-lead': theme('colors.scale[500]'),
            '--tw-prose-invert-links': theme('colors.white'),
            '--tw-prose-invert-bold': theme('colors.white'),
            '--tw-prose-invert-counters': theme('colors.scale[400]'),
            '--tw-prose-invert-bullets': theme('colors.scale[600]'),
            '--tw-prose-invert-hr': theme('colors.scale[700]'),
            '--tw-prose-invert-quotes': theme('colors.scale[100]'),
            '--tw-prose-invert-quote-borders': theme('colors.scale[700]'),
            '--tw-prose-invert-captions': theme('colors.scale[400]'),
            // the following are typography overrides
            // examples can be seen here —> https://github.com/tailwindlabs/tailwindcss-typography/blob/master/src/styles.js
            // reset all header font weights
            h4: {
              // override font size
              fontSize: '1.15em',
            },
            h5: {
              // h5 not included in --tw-prose-headings
              color: theme('colors.scale[1200]'),
            },
            'h1, h2, h3, h4, h5, h6': {
              fontWeight: '400',
            },
            'article h2, article h3, article h4, article h5, article h6': {
              marginTop: '2em',
              marginBottom: '1em',
            },
            p: {
              fontWeight: '400',
            },
            pre: {
              background: 'none',
              padding: 0,
              marginBottom: '32px',
            },
            ul: {
              listStyleType: 'none',
              paddingLeft: '1rem',
            },
            'ul li': {
              position: 'relative',
            },
            'ul li::before': {
              position: 'absolute',
              top: '0.75rem',
              left: '-1rem',
              height: '0.125rem',
              width: '0.5rem',
              borderRadius: '0.25rem',
              backgroundColor: 'hsl(var(--border-strong))',
              content: '""',
            },
            ol: {
              paddingLeft: '1rem',
              counterReset: 'item',
              listStyleType: 'none',
              marginBottom: '3rem',
            },
            'ol>li': {
              display: 'block',
              position: 'relative',
              paddingLeft: '1rem',
              marginBottom: '2rem',
            },
            'ol>li::before': {
              position: 'absolute',
              top: '0.25rem',
              left: '-1rem',
              height: '1.2rem',
              width: '1.2rem',
              borderRadius: '0.25rem',
              backgroundColor: 'hsl(var(--background-surface-100))',
              border: '1px solid hsl(var(--border-default))',
              content: 'counter(item) "  "',
              counterIncrement: 'item',
              fontSize: '12px',
              color: 'hsl(var(--foreground-muted))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            },

            'p img': {
              border: '1px solid hsl(var(--border-muted))',
              borderRadius: '4px',
              overflow: 'hidden',
            },
            iframe: {
              border: '1px solid ' + theme('borderColor.DEFAULT'),
              borderRadius: theme('borderRadius.lg'),
            },
            td: {
              borderBottom: '1px solid ' + theme('colors.scale[400]'),
            },
            code: {
              fontWeight: '400',
              padding: '0.2rem 0.4rem',
              backgroundColor: theme('colors.scale[400]'),
              border: '1px solid ' + theme('colors.scale[500]'),
              borderRadius: theme('borderRadius.lg'),
              wordBreak: 'break-all',
            },
            a: {
              position: 'relative',
              transition: 'color 0.3s ease-in-out',
              paddingBottom: '2px',
              fontWeight: '400',
              color: 'hsl(var(--colors-scale12))',
              textDecorationLine: 'underline',
              textDecorationColor: 'hsl(var(--brand-500))',
              textDecorationThickness: '1px',
              textUnderlineOffset: '4px',
            },
            'a:hover': {
              textDecorationColor: 'hsl(var(--colors-scale12))',
            },
            figcaption: {
              color: 'hsl(var(--foreground-muted))',
              fontFamily: 'Office Code Pro, monospace',
            },
            'figure.quote-figure p:first-child': {
              marginTop: '0 !important',
            },
            'figure.quote-figure p:last-child': {
              marginBottom: '0 !important',
            },
            figure: {
              margin: '3rem 0',
            },
            'figure img': {
              margin: '0 !important',
            },
          },
        },

        toc: {
          css: {
            ul: {
              'list-style-type': 'none',
              'padding-left': 0,
              margin: 0,
              li: {
                'padding-left': 0,
              },
              a: {
                display: 'block',
                marginBottom: '0.4rem',
                'text-decoration': 'none',
                fontSize: '0.8rem',
                fontWeight: '200',
                color: theme('colors.scale[1100]'),
                '&:hover': {
                  color: theme('colors.scale[1200]'),
                },
                'font-weight': '400',
              },
              // margin: 0,
              ul: {
                'list-style-type': 'none',
                li: {
                  marginTop: '0.2rem',
                  marginBottom: '0.2rem',
                  'padding-left': '0 !important',
                  'margin-left': '0.5rem',
                },
                a: {
                  fontWeight: '200',
                  color: theme('colors.scale[1000]'),
                  '&:hover': {
                    color: theme('colors.scale[1200]'),
                  },
                },
              },
            },
          },
        },
        // used in auto docs
        docs: {
          css: {
            '--tw-prose-body': theme('colors.scale[1100]'),
            '--tw-prose-headings': theme('colors.scale[1200]'),
            '--tw-prose-lead': theme('colors.scale[1100]'),
            '--tw-prose-links': theme('colors.brand[900]'),
            '--tw-prose-bold': theme('colors.scale[1100]'),
            '--tw-prose-counters': theme('colors.scale[1100]'),
            '--tw-prose-bullets': theme('colors.scale[900]'),
            '--tw-prose-hr': theme('colors.scale[500]'),
            '--tw-prose-quotes': theme('colors.scale[1100]'),
            '--tw-prose-quote-borders': theme('colors.scale[500]'),
            '--tw-prose-captions': theme('colors.scale[700]'),
            '--tw-prose-code': theme('colors.scale[1200]'),
            '--tw-prose-pre-code': theme('colors.scale[900]'),
            '--tw-prose-pre-bg': theme('colors.scale[400]'),
            '--tw-prose-th-borders': theme('colors.scale[500]'),
            '--tw-prose-td-borders': theme('colors.scale[200]'),
            '--tw-prose-invert-body': theme('colors.scale[200]'),
            '--tw-prose-invert-headings': theme('colors.white'),
            '--tw-prose-invert-lead': theme('colors.scale[500]'),
            '--tw-prose-invert-links': theme('colors.white'),
            '--tw-prose-invert-bold': theme('colors.white'),
            '--tw-prose-invert-counters': theme('colors.scale[400]'),
            '--tw-prose-invert-bullets': theme('colors.scale[600]'),
            '--tw-prose-invert-hr': theme('colors.scale[700]'),
            '--tw-prose-invert-quotes': theme('colors.scale[100]'),
            '--tw-prose-invert-quote-borders': theme('colors.scale[700]'),
            '--tw-prose-invert-captions': theme('colors.scale[400]'),
            // the following are typography overrides
            // examples can be seen here —> https://github.com/tailwindlabs/tailwindcss-typography/blob/master/src/styles.js
            // reset all header font weights
            'h1, h2, h3, h4, h5': {
              fontWeight: '400',
            },
          },
        },
      }),
      screens: {
        xs: '480px',
      },
      fontFamily: {
        sans: ['Circular', 'custom-font', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['Office Code Pro', 'Source Code Pro', 'Menlo', 'monospace'],
      },

      // shadcn defaults START
      keyframes: {
        'flash-code': {
          '0%': { backgroundColor: 'rgba(63, 207, 142, 0.1)' },
          '100%': { backgroundColor: 'transparent' },
        },
      },
      animation: {
        'flash-code': 'flash-code 1s forwards',
        'flash-code-slow': 'flash-code 2s forwards',
      },
      // borderRadius: {
      //   lg: `var(--radius)`,
      //   md: `calc(var(--radius) - 2px)`,
      //   sm: 'calc(var(--radius) - 4px)',
      // },
      // fontFamily: {
      //   sans: ['var(--font-sans)', ...fontFamily.sans],
      // },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
      },
      // shadcn defaults END
    },
  },
  plugins: [require('@tailwindcss/typography'), require('tailwindcss-animate')],
})

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
  return deepMerge({ ...tailwindConfig }, uiConfig, {
    arrayMerge: arrayMergeFn,
  })
}

module.exports = wrapper
