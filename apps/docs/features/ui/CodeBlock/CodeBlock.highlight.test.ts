import { bundledLanguages, createHighlighter, type Highlighter } from 'shiki'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import theme from './supabase-2.json' with { type: 'json' }

vi.mock('shiki', async (importOriginal) => {
  const actual = await importOriginal<typeof import('shiki')>()
  return { ...actual, createHighlighter: vi.fn() }
})

const result = {
  tokens: [[{ content: 'select', offset: 0, color: 'var(--code-token-keyword)', fontStyle: 1 }]],
}
const highlighter = {
  codeToTokens: vi.fn<Highlighter['codeToTokens']>(),
  loadLanguage: vi.fn(),
  loadTheme: vi.fn(),
}
const create = vi.mocked(createHighlighter, { partial: true })

describe('shared code block highlighting', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.resetAllMocks()
    create.mockResolvedValue(highlighter)
    highlighter.codeToTokens.mockReturnValue(result)
  })

  it('initializes all languages once and never reloads languages or themes between blocks', async () => {
    const { highlightCode } = await import('./CodeBlock.highlight')
    expect(create).not.toHaveBeenCalled()

    await highlightCode('echo hello', 'bash')
    await highlightCode('select 42', 'sql')
    await highlightCode('echo again', 'shell')

    expect(create).toHaveBeenCalledExactlyOnceWith({
      themes: [theme],
      langs: Object.keys(bundledLanguages),
    })
    expect(create.mock.calls[0][0].themes?.[0]).not.toBe(theme)
    expect(highlighter.loadLanguage).not.toHaveBeenCalled()
    expect(highlighter.loadTheme).not.toHaveBeenCalled()
  })

  it.each(['javascript', 'js', null] as const)(
    'forwards the source and options for %s and returns the tokens unchanged',
    async (lang) => {
      const { highlightCode } = await import('./CodeBlock.highlight')
      expect(await highlightCode('const value = 42', lang)).toBe(result)
      expect(highlighter.codeToTokens).toHaveBeenCalledExactlyOnceWith('const value = 42', {
        lang: lang ?? undefined,
        theme: 'Supabase Theme',
        tokenizeTimeLimit: 0,
        tokenizeMaxLineLength: 100_000,
      })
    }
  )

  it('shares pending initialization across concurrent languages and aliases', async () => {
    const { promise, resolve } = Promise.withResolvers<typeof highlighter>()
    create.mockReturnValue(promise)
    const { highlightCode } = await import('./CodeBlock.highlight')
    const pending = [
      highlightCode('echo hello', 'bash'),
      highlightCode('echo again', 'shell'),
      highlightCode('select 42', 'sql'),
    ]
    expect(create).toHaveBeenCalledTimes(1)
    expect(highlighter.codeToTokens).not.toHaveBeenCalled()

    resolve(highlighter)
    expect(await Promise.all(pending)).toEqual([result, result, result])
    expect(highlighter.codeToTokens).toHaveBeenCalledTimes(3)
  })

  it('retains initialization failures without adding retries', async () => {
    const failure = new Error('Highlighter could not be initialized')
    create.mockRejectedValue(failure)
    const { highlightCode } = await import('./CodeBlock.highlight')

    await expect(highlightCode('echo hello', 'bash')).rejects.toBe(failure)
    await expect(highlightCode('select 42', 'sql')).rejects.toBe(failure)
    expect(create).toHaveBeenCalledTimes(1)
    expect(highlighter.codeToTokens).not.toHaveBeenCalled()
  })
})
