const plugin = require('tailwindcss/plugin')

/**
 * Hit Area plugin (Tailwind v3)
 *
 * Expands the interactive hit area of an element using a ::before pseudo-element,
 * without affecting the visual layout.
 *
 * Usage:
 *   hit-area          — adds invisible ::before that fills the element (0px expansion)
 *   hit-area-debug    — same but with a visible blue dashed border overlay (hover turns green)
 *   hit-area-{n}      — expands all sides by spacing value n (e.g. hit-area-2 → -0.5rem on each side)
 *   hit-area-x-{n}    — expands left + right
 *   hit-area-y-{n}    — expands top + bottom
 *   hit-area-t-{n}    — expands top only
 *   hit-area-b-{n}    — expands bottom only
 *   hit-area-l-{n}    — expands left only
 *   hit-area-r-{n}    — expands right only
 *
 * Arbitrary values are also supported, e.g. hit-area-[12px], hit-area-x-[1rem].
 */
module.exports = plugin(function ({ addUtilities, matchUtilities, theme }) {
  const beforeBase = {
    content: '""',
    position: 'absolute',
    top: 'var(--hit-area-t, 0px)',
    right: 'var(--hit-area-r, 0px)',
    bottom: 'var(--hit-area-b, 0px)',
    left: 'var(--hit-area-l, 0px)',
    pointerEvents: 'inherit',
  }

  // Static utilities
  addUtilities({
    '.hit-area': {
      position: 'relative',
      '&::before': { ...beforeBase },
    },
    '.hit-area-debug': {
      position: 'relative',
      '&::before': {
        ...beforeBase,
        border: '1px dashed #3b82f6',
        backgroundColor: 'rgb(59 130 246 / 0.1)',
      },
      '&:hover::before': {
        border: '1px dashed #22c55e',
        backgroundColor: 'rgb(34 197 94 / 0.1)',
      },
    },
  })

  const spacingConfig = { values: theme('spacing'), supportsNegativeValues: false }

  // hit-area-{value} — all sides
  matchUtilities(
    {
      'hit-area': (value) => ({
        position: 'relative',
        '--hit-area-t': `calc(${value} * -1)`,
        '--hit-area-b': `calc(${value} * -1)`,
        '--hit-area-l': `calc(${value} * -1)`,
        '--hit-area-r': `calc(${value} * -1)`,
        '&::before': { ...beforeBase },
      }),
    },
    spacingConfig
  )

  // hit-area-x-{value} — left + right
  matchUtilities(
    {
      'hit-area-x': (value) => ({
        position: 'relative',
        '--hit-area-l': `calc(${value} * -1)`,
        '--hit-area-r': `calc(${value} * -1)`,
        '&::before': { ...beforeBase },
      }),
    },
    spacingConfig
  )

  // hit-area-y-{value} — top + bottom
  matchUtilities(
    {
      'hit-area-y': (value) => ({
        position: 'relative',
        '--hit-area-t': `calc(${value} * -1)`,
        '--hit-area-b': `calc(${value} * -1)`,
        '&::before': { ...beforeBase },
      }),
    },
    spacingConfig
  )

  // hit-area-t-{value} — top only
  matchUtilities(
    {
      'hit-area-t': (value) => ({
        position: 'relative',
        '--hit-area-t': `calc(${value} * -1)`,
        '&::before': { ...beforeBase },
      }),
    },
    spacingConfig
  )

  // hit-area-b-{value} — bottom only
  matchUtilities(
    {
      'hit-area-b': (value) => ({
        position: 'relative',
        '--hit-area-b': `calc(${value} * -1)`,
        '&::before': { ...beforeBase },
      }),
    },
    spacingConfig
  )

  // hit-area-l-{value} — left only
  matchUtilities(
    {
      'hit-area-l': (value) => ({
        position: 'relative',
        '--hit-area-l': `calc(${value} * -1)`,
        '&::before': { ...beforeBase },
      }),
    },
    spacingConfig
  )

  // hit-area-r-{value} — right only
  matchUtilities(
    {
      'hit-area-r': (value) => ({
        position: 'relative',
        '--hit-area-r': `calc(${value} * -1)`,
        '&::before': { ...beforeBase },
      }),
    },
    spacingConfig
  )
})
