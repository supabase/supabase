import { inferLanguage } from 'templates'

/**
 * Maps template language ids onto the languages the shared CodeBlock has
 * registered for syntax highlighting.
 */
export function toCodeBlockLang(langOrPath: string): string {
  const raw =
    langOrPath.includes('/') || langOrPath.includes('.') ? inferLanguage(langOrPath) : langOrPath

  switch (raw) {
    case 'terminal':
      return 'bash'
    case 'typescript':
    case 'tsx':
    case 'ts':
      return 'ts'
    case 'javascript':
    case 'jsx':
    case 'js':
      return 'js'
    case 'sql':
      return 'sql'
    case 'toml':
      return 'toml'
    case 'json':
      return 'json'
    case 'text':
      return 'bash'
    default:
      return raw
  }
}
