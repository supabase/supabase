import type { ValidLanguages } from '@/components/ui/CodeEditor/CodeEditor'

export const CODE_BLOCK_LANGUAGES = [
  { label: 'Plain text', value: 'text' },
  { label: 'SQL', value: 'sql' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'JSON', value: 'json' },
  { label: 'HTML', value: 'html' },
  { label: 'CSS', value: 'css' },
  { label: 'Markdown', value: 'markdown' },
] as const

type CodeBlockLanguage = (typeof CODE_BLOCK_LANGUAGES)[number]['value']

const codeBlockLanguageByAlias: Record<string, CodeBlockLanguage> = {
  css: 'css',
  html: 'html',
  javascript: 'javascript',
  js: 'javascript',
  json: 'json',
  markdown: 'markdown',
  md: 'markdown',
  pgsql: 'sql',
  plaintext: 'text',
  sql: 'sql',
  text: 'text',
  txt: 'text',
  typescript: 'typescript',
  ts: 'typescript',
}

const codeEditorLanguageByAlias: Record<string, ValidLanguages> = {
  bash: 'plaintext',
  css: 'css',
  html: 'html',
  javascript: 'javascript',
  js: 'javascript',
  json: 'json',
  markdown: 'markdown',
  md: 'markdown',
  pgsql: 'pgsql',
  sql: 'pgsql',
  text: 'plaintext',
  txt: 'plaintext',
  typescript: 'typescript',
  ts: 'typescript',
}

export const getCodeBlockLanguage = (language?: string): string => {
  if (!language) return 'text'

  // MDXEditor's markdown shortcut hands us the opening fence instead of the language when a
  // fenced block is typed, because it reads the wrong capture group from Lexical 0.48's start
  // regex. Treat that as unset. https://github.com/mdx-editor/editor/issues/825
  if (/^[ \t]*`{3,}$/.test(language)) return 'text'

  return codeBlockLanguageByAlias[language.toLowerCase()] ?? language
}

export const getCodeEditorLanguage = (language?: string): ValidLanguages =>
  codeEditorLanguageByAlias[language?.toLowerCase() ?? ''] ?? 'plaintext'
