import { describe, expect, it } from 'vitest'

const {
  buildTailwindCategoryColors,
  buildTailwindColorExtend,
  getCssVariableName,
  getTailwindColorValue,
} = require('../../styles/color-registry')

describe('color registry helpers', () => {
  it('maps token keys to runtime css variables', () => {
    expect(getCssVariableName('background-DEFAULT')).toBe('background-default')
    expect(getCssVariableName('_secondary-DEFAULT')).toBe('secondary-default')
    expect(getCssVariableName('code_block-3')).toBe('code-block-3')
  })

  it('builds nested tailwind colors with default aliases intact', () => {
    expect(
      buildTailwindCategoryColors('background')
    ).toMatchObject({
      DEFAULT: 'hsl(var(--background-default) / <alpha-value>)',
      default: 'hsl(var(--background-default) / <alpha-value>)',
      overlay: {
        DEFAULT: 'hsl(var(--background-overlay-default) / <alpha-value>)',
      },
      surface: {
        100: 'hsl(var(--background-surface-100) / <alpha-value>)',
      },
    })
  })

  it('preserves raw token namespaces used by existing utilities', () => {
    expect(buildTailwindColorExtend(['_secondary-DEFAULT', 'code_block-1', 'colors-white'])).toMatchObject({
      _secondary: {
        DEFAULT: 'hsl(var(--secondary-default) / <alpha-value>)',
      },
      code_block: {
        1: 'hsl(var(--code-block-1) / <alpha-value>)',
      },
      colors: {
        white: 'hsl(var(--colors-white) / <alpha-value>)',
      },
    })
  })

  it('keeps alpha tokens as raw color values', () => {
    expect(getTailwindColorValue('custom-alpha-500')).toBe('var(--custom-alpha-500)')
  })
})
