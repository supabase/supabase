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
    expect(css).toContain('--brand-link: 155deg 100% 38.6%;')
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

  it('captures typography sizes, line heights, and weights from the active Studio styles', () => {
    const css = buildGeneratedPageThemeStyles(
      stylesFrom({
        '--text-base': '0.9375rem',
        '--text-2xl': '1.375rem',
        '--text-2xl--line-height': 'calc(2 / 1.5)',
        '--font-weight-medium': '500',
        '--tracking-tight': '-0.025em',
        '--spacing': '0.25rem',
        '--radius-md': '0.375rem',
        '--radius-lg': '0.5rem',
      })
    )

    expect(css).toContain('--text-base: 0.9375rem;')
    expect(css).toContain('--text-2xl: 1.375rem;')
    expect(css).toContain('--text-2xl--line-height: calc(2 / 1.5);')
    expect(css).toContain('--font-weight-medium: 500;')
    expect(css).toContain('--tracking-tight: -0.025em;')
    expect(css).toContain('--spacing: 0.25rem;')
    expect(css).toContain('--radius-md: 0.375rem;')
    expect(css).toContain('--radius-lg: 0.5rem;')
  })

  it('omits absent variables and uses a light fallback when styles are unavailable', () => {
    expect(buildGeneratedPageThemeStyles(stylesFrom({}))).toBe(':root { color-scheme: light;  }')
  })

  it('preserves Studio font names and appends safe fallbacks for the isolated frame', () => {
    const css = buildGeneratedPageThemeStyles(
      stylesFrom({
        '--font-sans': '"Studio Inter"',
        '--font-heading': '"Studio Manrope"',
        '--font-mono': '"Studio Mono"',
        '--font-source-code-pro': '"Source Code Pro"',
      })
    )

    expect(css).toContain('--font-sans: "Studio Inter", ui-sans-serif, system-ui, sans-serif;')
    expect(css).toContain('--font-heading: "Studio Manrope", ui-sans-serif, system-ui, sans-serif;')
    expect(css).toContain('--font-mono: "Studio Mono", ui-monospace, Menlo, Consolas, monospace;')
    expect(css).toContain(
      '--font-source-code-pro: "Source Code Pro", ui-monospace, Menlo, Consolas, monospace;'
    )
  })

  it('escapes values that could close the inline style element', () => {
    const css = buildGeneratedPageThemeStyles(
      stylesFrom({ '--background': '</style><script>alert(1)</script>' })
    )

    expect(css).not.toContain('<')
    expect(css).toContain('\\3c /style>')
  })
})
