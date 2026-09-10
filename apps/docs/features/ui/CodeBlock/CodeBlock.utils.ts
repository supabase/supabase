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
