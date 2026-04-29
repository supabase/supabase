const plugin = require('tailwindcss/plugin')
/**
 * Plugin to add `safe` versions of the `transition-*` properties, which respect
 * `prefers-reduced-motion`.
 *
 * When users prefer reduced motion, the duration of transform transitions is
 * reduced to something negiglible (1ms). The original `transition-*` properties
 * aren't overridden to provide flexibility, in situations where you want to
 * handle the `prefers-reduced-motion` case some other way.
 *
 * See https://css-tricks.com/levels-of-fix/.
 *
 * Usage: <div className="transition-safe duration-safe-100">
 *        - Transitioned properties will animate with duration 100, _except_
 *          transform properties when prefers-reduced-motion is on, which
 *          will animate instantaneously.
 *
 * Note:
 *   - `duration-safe` must be used with `transition-safe`
 *   - Non-safe `duration` must be used with non-safe `transition`
 *   - (Cannot be mixed)
 */
module.exports = plugin(function ({ addUtilities, matchUtilities, theme }) {
  addUtilities({
    '.transition-safe': {
      transitionProperty:
        'color, transform, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, filter, backdrop-filter',
      transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      transitionDuration: '150ms',
      '@media (prefers-reduced-motion)': {
        transitionDuration:
          '150ms, 1ms, 150ms, 150ms, 150ms, 150ms, 150ms, 150ms, 150ms, 150s, 150ms',
      },
    },
    '.transition-safe-all': {
      transitionProperty: 'all, transform',
      transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      transitionDuration: '150ms',
      '@media (prefers-reduced-motion)': {
        transitionDuration: '150ms, 1ms',
      },
    },
    '.transition-safe-transform': {
      /**
       * The duplicate `transform` here is a hacky way of dealing with the fact
       * that `transform` must be second in `transition-safe-all` to override
       * `all`, and its order must be the same across all `transition-safe-*`
       * classes, so the proper duration applies in `duration-safe`.
       */
      transitionProperty: 'transform, transform',
      transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      transitionDuration: '150ms',
      '@media (prefers-reduced-motion)': {
        transitionDuration: '1ms',
      },
    },
    /* Hide scrollbar for Chrome, Safari and Opera */
    '.no-scrollbar::-webkit-scrollbar': {
      display: 'none',
    },
    /* Hide scrollbar for IE, Edge and Firefox */
    '.no-scrollbar': {
      '-ms-overflow-style': 'none' /* IE and Edge */,
      'scrollbar-width': 'none' /* Firefox */,
    },
  })

  matchUtilities(
    {
      'duration-safe': (value) => ({
        transitionDuration: value,
        '@media (prefers-reduced-motion)': {
          /**
           * Preserves the indicated duration for everything except `transform`.
           *
           * Relies on browsers truncating the `transition-duration` property
           * if there are more values than there are transitioned properties.
           */
          transitionDuration: `${value}, 1ms, ${value}, ${value}, ${value}, ${value}, ${value}, ${value}, ${value}, ${value}, ${value}`,
        },
      }),
    },
    { values: theme('transitionDuration') }
  )
})
