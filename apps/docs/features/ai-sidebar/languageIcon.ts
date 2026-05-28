const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '/docs'

export type LanguageIconVariant = 'color' | 'mono'

const COLOR_ICON_MAP: Record<string, string> = {
  js: 'javascript-icon.svg',
  jsx: 'javascript-icon.svg',
  javascript: 'javascript-icon.svg',
  ts: 'javascript-icon.svg',
  tsx: 'javascript-icon.svg',
  typescript: 'javascript-icon.svg',
  py: 'python-icon.svg',
  python: 'python-icon.svg',
  dart: 'dart-icon.svg',
  flutter: 'flutter-icon.svg',
  swift: 'swift-icon.svg',
}

const MONO_ICON_MAP: Record<string, string> = {
  kotlin: 'reference-kotlin',
  csharp: 'reference-csharp',
  cs: 'reference-csharp',
  bash: 'reference-cli',
  sh: 'reference-cli',
  shell: 'reference-cli',
  sql: 'reference-api',
  pgsql: 'reference-api',
  json: 'reference-api',
  yaml: 'reference-api',
  yml: 'reference-api',
  html: 'reference-api',
  http: 'reference-api',
  curl: 'reference-cli',
}

export function normalizeCodeLanguage(language: string) {
  return language.toLowerCase().trim().replace(/^language-/, '')
}

export function getLanguageIconSrc(
  language: string,
  { isDarkTheme = true }: { isDarkTheme?: boolean } = {}
): { src: string; variant: LanguageIconVariant } | null {
  const lang = normalizeCodeLanguage(language)
  const colorFile = COLOR_ICON_MAP[lang]

  if (colorFile) {
    return {
      src: `${BASE_PATH}/img/icons/languages/${colorFile}`,
      variant: 'color',
    }
  }

  const monoKey = MONO_ICON_MAP[lang]
  if (monoKey) {
    const suffix = isDarkTheme ? '' : '-light'
    return {
      src: `${BASE_PATH}/img/icons/menu/${monoKey}${suffix}.svg`,
      variant: 'mono',
    }
  }

  return null
}

export function getLanguageLabel(language: string, lineCount: number) {
  const lang = normalizeCodeLanguage(language)
  const displayLang = lang === 'js' ? 'javascript' : lang === 'ts' ? 'typescript' : lang
  return `${displayLang}, ${lineCount} ${lineCount === 1 ? 'line' : 'lines'}`
}
