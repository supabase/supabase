import { describe, expect, it } from 'vitest'

import { buildGeneratedPageThemeStyles } from './generated-page-theme'

const stylesFrom = (variables: Record<string, string>) => ({
  getPropertyValue: (name: string) => variables[name] ?? '',
})

describe('buildGeneratedPageThemeStyles', () => {
  it.each(['Light', 'Dark'])('captures the active %s palette and color scheme', (appearance) => {
    const background = appearance === 'Dark' ? 'oklch(0.19 0.0025 159)' : 'oklch(0.995 0 34)'
    const css = buildGeneratedPageThemeStyles(
      stylesFrom({
        '--helpers-os-appearance': ` ${appearance} `,
        '--background': background,
        '--primary': 'oklch(0.76 0.15 159)',
        '--brand-link': '155deg 100% 38.6%',
        '--unrelated-variable': 'do not copy',
      })
    )

    expect(css).toContain(`color-scheme: ${appearance.toLowerCase()}`)
    expect(css).toContain(`--background: ${background};`)
    expect(css).toContain('--primary: oklch(0.76 0.15 159);')
    expect(css).not.toContain('--brand-link')
    expect(css).not.toContain('--unrelated-variable')
    expect(css).not.toContain('--card:')
  })

  it('preserves appearance customizations instead of substituting a fixed palette', () => {
    const css = buildGeneratedPageThemeStyles(
      stylesFrom({ '--primary': 'oklch(0.7 0.14 280)', '--border': 'oklch(0.9 0 0 / 0.3)' })
    )

    expect(css).toContain('--primary: oklch(0.7 0.14 280);')
    expect(css).toContain('--border: oklch(0.9 0 0 / 0.3);')
  })

  it('omits absent variables and uses a light fallback when styles are unavailable', () => {
    expect(buildGeneratedPageThemeStyles(stylesFrom({}))).toBe(':root { color-scheme: light;  }')
  })

  it('escapes values that could close the inline style element', () => {
    const css = buildGeneratedPageThemeStyles(
      stylesFrom({ '--background': '</style><script>alert(1)</script>' })
    )

    expect(css).not.toContain('<')
    expect(css).toContain('\\3c /style>')
  })
})
