import { bundledLanguages, createHighlighter, type BundledLanguage } from 'shiki'

import theme from './supabase-2.json' with { type: 'json' }

let highlighterPromise: ReturnType<typeof createHighlighter> | undefined

export async function highlightCode(code: string, lang: BundledLanguage | null) {
  // init all grammars once so later blocks stay fast
  const highlighter = await (highlighterPromise ??= createHighlighter({
    themes: [structuredClone(theme)],
    langs: Object.keys(bundledLanguages),
  }))

  return highlighter.codeToTokens(code, {
    lang: lang || undefined,
    theme: 'Supabase Theme',
    tokenizeTimeLimit: 0,
    tokenizeMaxLineLength: 100_000,
  })
}
