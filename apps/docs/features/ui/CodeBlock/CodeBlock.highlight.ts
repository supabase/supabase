import {
  bundledLanguages,
  createHighlighter,
  makeSingletonHighlighter,
  type BundledLanguage,
} from 'shiki'

import theme from './supabase-2.json' with { type: 'json' }

const getHighlighter = makeSingletonHighlighter(() =>
  createHighlighter({ themes: [structuredClone(theme)], langs: [] })
)

// keep the eager highlighter's tagged templates and component syntax intact
const INJECTED_LANGUAGES: Record<string, Array<BundledLanguage>> = {
  'source.js': ['ts-tags'],
  'source.ts': ['ts-tags'],
  'text.html.markdown': ['vue'],
  'text.html.derivative': ['angular-html', 'vue'],
  'text.pug': ['vue'],
}

export async function highlightCode(code: string, lang: BundledLanguage | null) {
  const highlighter = await getHighlighter()
  if (lang && !highlighter.getLoadedLanguages().includes(lang)) {
    const languages = new Set<BundledLanguage>()

    async function collectLanguages(language: BundledLanguage) {
      if (languages.has(language)) return
      languages.add(language)
      const { default: grammars } = await bundledLanguages[language]()
      await Promise.all(
        grammars.flatMap(({ embeddedLangsLazy = [], scopeName }) => {
          const injected = Object.entries(INJECTED_LANGUAGES).flatMap(([scope, languages]) =>
            scopeName === scope || scopeName.startsWith(`${scope}.`) ? languages : []
          )
          return [...embeddedLangsLazy, ...injected].map((embedded) =>
            collectLanguages(embedded as BundledLanguage)
          )
        })
      )
    }

    await collectLanguages(lang)
    await highlighter.loadLanguage(...languages)
  }

  return highlighter.codeToTokens(code, {
    lang: lang || undefined,
    theme: 'Supabase Theme',
    tokenizeTimeLimit: 0,
    tokenizeMaxLineLength: 100_000,
  })
}
