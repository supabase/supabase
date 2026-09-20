// As defined in @shikijs/core/dist/chunk-tokens.d.mts
enum FontStyle {
  NotSet = -1,
  None = 0,
  Italic = 1,
  Bold = 2,
  Underline = 4,
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
const COLOR_CLASSES: Record<string, string> = {
  'var(--code-foreground)': 's-f',
  'var(--code-token-comment)': 's-c',
  'var(--code-token-constant)': 's-n',
  'var(--code-token-function)': 's-u',
  'var(--code-token-keyword)': 's-k',
  'var(--code-token-parameter)': 's-a',
  'var(--code-token-property)': 's-r',
  'var(--code-token-punctuation)': 's-p',
  'var(--code-token-string)': 's-s',
  'var(--code-token-string-expression)': 's-e',
  'var(--code-token-variable)': 's-v',
}

export const getTokenClassName = (
  color: string | undefined,
  fontStyle: number | undefined
): string | undefined => {
  const classes: Array<string> = []
  const colorClass = color === undefined ? undefined : COLOR_CLASSES[color]
  if (colorClass) classes.push(colorClass)
  if (fontStyle && fontStyle > 0) {
    if (fontStyle & FontStyle.Italic) classes.push('s-i')
    if (fontStyle & FontStyle.Bold) classes.push('s-b')
    if (fontStyle & FontStyle.Underline) classes.push('s-l')
  }
  return classes.length ? classes.join(' ') : undefined
}
