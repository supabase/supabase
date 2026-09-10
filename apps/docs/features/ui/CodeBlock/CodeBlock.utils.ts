import { type CSSProperties } from 'react'

// As defined in @shikijs/core/dist/chunk-tokens.d.mts
enum FontStyle {
  NotSet = -1,
  None = 0,
  Italic = 1,
  Bold = 2,
  Underline = 4,
}

export function getFontStyle(styleFlags: number): CSSProperties {
  let style: CSSProperties = {}

  if (styleFlags & FontStyle.Italic) {
    ;(style ??= {}).fontStyle = 'italic'
  }

  if (styleFlags & FontStyle.Bold) {
    ;(style ??= {}).fontWeight = 'bold'
  }

  if (styleFlags & FontStyle.Underline) {
    ;(style ??= {}).textDecoration = 'underline'
  }

  return style
}

// Fence aliases a screen reader would otherwise read letter by letter
const LANGUAGE_LABELS: Record<string, string> = {
  c: 'C',
  html: 'HTML',
  js: 'JavaScript',
  json: 'JSON',
  jsx: 'JavaScript',
  py: 'Python',
  sh: 'Shell',
  shell: 'Shell',
  sql: 'SQL',
  toml: 'TOML',
  ts: 'TypeScript',
  tsx: 'TypeScript',
  yaml: 'YAML',
}

export function getCodeBlockLabel(lang: string | null, lineCount: number): string {
  const lines = `${lineCount} ${lineCount === 1 ? 'line' : 'lines'}`
  if (!lang) return lines
  return `${LANGUAGE_LABELS[lang] ?? lang}, ${lines}`
}

/*
 * Shiki gives every token a ~30 char css variable name making page heavier
 * this sends a one letter code instead for perf optimization
 *
 * nb. color missing from this table still renders but full length
 */
const COLOR_CODES: Record<string, string> = {
  'var(--code-foreground)': 'f',
  'var(--code-token-comment)': 'c',
  'var(--code-token-constant)': 'n',
  'var(--code-token-function)': 'u',
  'var(--code-token-keyword)': 'k',
  'var(--code-token-parameter)': 'a',
  'var(--code-token-property)': 'r',
  'var(--code-token-punctuation)': 'p',
  'var(--code-token-string)': 's',
  'var(--code-token-string-expression)': 'e',
  'var(--code-token-variable)': 'v',
}

const COLORS_BY_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(COLOR_CODES).map(([color, code]) => [code, color])
)

export const encodeTokenColor = (color: string | undefined): string | undefined =>
  color === undefined ? undefined : (COLOR_CODES[color] ?? color)

export const decodeTokenColor = (code: string | undefined): string | undefined =>
  code === undefined ? undefined : (COLORS_BY_CODE[code] ?? code)
