import { bundledLanguages, createHighlighter, type BundledLanguage } from 'shiki'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import theme from './supabase-2.json' with { type: 'json' }

vi.mock('shiki', async (importOriginal) => {
  const actual = await importOriginal<typeof import('shiki')>()
  return { ...actual, createHighlighter: vi.fn(actual.createHighlighter) }
})

const fixtures: Array<{ name: string; lang: BundledLanguage | null; code: string }> = [
  { name: 'Bash', lang: 'bash', code: 'echo "hello ${USER}"\n# A comment' },
  { name: 'shell alias', lang: 'shell', code: "supabase sso add --metadata-url 'https://...'" },
  {
    name: 'JavaScript',
    lang: 'javascript',
    code: 'const greeting = /hello/g\ngreeting.test("hello")',
  },
  { name: 'JavaScript alias', lang: 'js', code: 'const value = 42\nconsole.log(value)' },
  {
    name: 'TypeScript',
    lang: 'typescript',
    code: 'interface User { id: number }\nconst id: User["id"] = 42',
  },
  { name: 'TypeScript alias', lang: 'ts', code: 'const count: number = 42' },
  {
    name: 'SQL',
    lang: 'sql',
    code: "select 'You had me at SELECT' as greeting, 42 as count;\n-- A comment",
  },
  { name: 'JSON', lang: 'json', code: '{"name":"reader","active":true}' },
  {
    name: 'Elixir',
    lang: 'elixir',
    code: 'defmodule Hello do\n  def greet(name), do: "Hello #{name}"\nend',
  },
  {
    name: 'HTML scripts and styles',
    lang: 'html',
    code: '<style>.item { color: red; }</style>\n<script>const greeting = "hello"</script>',
  },
  {
    name: 'Markdown frontmatter, raw HTML, and fenced aliases',
    lang: 'markdown',
    code: [
      '---',
      'title: "Greeting"',
      'published: true',
      '---',
      '# Heading',
      '<div class="item">Hi</div>',
      '',
      '```ts',
      'const value: number = 42',
      '```',
      '',
      '```sh',
      'echo "hello ${USER}"',
      '```',
    ].join('\n'),
  },
  {
    name: 'MDX frontmatter, JSX, and fenced SQL',
    lang: 'mdx',
    code: '---\ntitle: "Greeting"\n---\nimport Component from "./component"\n\n<Component value={42} />\n\n```sql\nselect 42;\n```',
  },
  {
    name: 'Vue TypeScript and SCSS',
    lang: 'vue',
    code: '<template><div>{{ greeting }}</div></template>\n<script setup lang="ts">const greeting: string = "hello"</script>\n<style lang="scss">.item { &.active { color: red; } }</style>',
  },
  {
    name: 'Astro frontmatter and SCSS',
    lang: 'astro',
    code: '---\nconst title: string = "Hello"\n---\n<h1>{title}</h1>\n<style lang="scss">h1 { color: red; }</style>',
  },
  { name: 'empty code', lang: 'typescript', code: '' },
  { name: 'plain text', lang: null, code: 'plain <text> & punctuation\n  second line' },
  {
    name: 'JavaScript tagged template injections',
    lang: 'javascript',
    code: 'const result = sql`select * from users where id = 42`\nconst style = css`div { color: red; }`\nconst markup = html`<div class="item">Hi</div>`',
  },
  {
    name: 'JSX tagged template injections',
    lang: 'jsx',
    code: 'const style = css`div { color: red; }`\nconst element = <div>{style}</div>',
  },
  {
    name: 'Markdown Vue and Angular injections',
    lang: 'markdown',
    code: '<div v-if="active">{{ name }}</div>\n\n@if (active) { <p>Hello</p> }\n\n```vue\n<template><p>{{ name }}</p></template>\n```',
  },
  {
    name: 'HTML embedded tagged templates',
    lang: 'html',
    code: '<script>const result = sql`select 42`</script>',
  },
]

describe('selective code block highlighting', () => {
  let baseline: Awaited<ReturnType<typeof createHighlighter>>
  let createActualHighlighter: typeof createHighlighter
  const create = vi.mocked(createHighlighter)

  beforeAll(async () => {
    const actual = await vi.importActual<typeof import('shiki')>('shiki')
    createActualHighlighter = actual.createHighlighter
    baseline = await createActualHighlighter({
      themes: [structuredClone(theme)],
      langs: Object.keys(bundledLanguages),
    })
  })

  beforeEach(() => {
    vi.resetModules()
    create.mockReset().mockImplementation(createActualHighlighter)
  })

  afterEach(async () => {
    for (const result of create.mock.results) {
      if (result.type === 'return') {
        await result.value.then(
          (highlighter) => highlighter.dispose(),
          () => {}
        )
      }
    }
    vi.restoreAllMocks()
  })

  afterAll(() => baseline.dispose())

  function expected({ code, lang }: (typeof fixtures)[number]) {
    return baseline.codeToTokens(code, {
      lang: lang || undefined,
      theme: 'Supabase Theme',
      tokenizeTimeLimit: 0,
      tokenizeMaxLineLength: 100_000,
    }).tokens
  }

  it('defers initialization until first use and reuses the theme and highlighter', async () => {
    const { highlightCode } = await import('./CodeBlock.highlight')
    expect(create).not.toHaveBeenCalled()

    const first = fixtures[0]
    expect((await highlightCode(first.code, first.lang)).tokens).toEqual(expected(first))
    expect(create).toHaveBeenCalledTimes(1)
    const highlighter = await create.mock.results[0].value
    expect(highlighter.getLoadedLanguages()).toContain('bash')
    expect(highlighter.getLoadedLanguages()).not.toContain('sql')
    expect(highlighter.getLoadedLanguages()).not.toContain('markdown')
    expect(highlighter.getLoadedLanguages()).not.toContain('typescript')

    const loadLanguage = vi.spyOn(highlighter, 'loadLanguage')
    const loadTheme = vi.spyOn(highlighter, 'loadTheme')
    const second = fixtures.find(({ lang }) => lang === 'sql')!
    await highlightCode(second.code, second.lang)
    expect((await highlightCode(first.code, first.lang)).tokens).toEqual(expected(first))
    expect(create).toHaveBeenCalledTimes(1)
    expect(highlighter.getLoadedLanguages()).toContain('sql')
    expect(loadLanguage.mock.calls.filter((args) => args.length)).toEqual([['sql']])
    expect(loadTheme.mock.calls.every((args) => args.length === 0)).toBe(true)
    expect(highlighter.getLoadedThemes()).toEqual(['Supabase Theme'])
  })

  it('shares initialization across concurrent languages and aliases', async () => {
    const { highlightCode } = await import('./CodeBlock.highlight')
    const selected = [fixtures[0], fixtures[0], fixtures[1], fixtures[6]]
    const results = await Promise.all(selected.map(({ code, lang }) => highlightCode(code, lang)))
    expect(results.map(({ tokens }) => tokens)).toEqual(selected.map(expected))
    expect(create).toHaveBeenCalledTimes(1)
  })

  it.each(fixtures)(
    'matches eager token colors, font flags, and offsets for $name',
    async (fixture) => {
      const { highlightCode } = await import('./CodeBlock.highlight')
      const result = await highlightCode(fixture.code, fixture.lang)
      expect(result.tokens).toEqual(expected(fixture))
    }
  )

  it('keeps embedded tokens and CSS-variable colors stable across rendering order', async () => {
    const { highlightCode } = await import('./CodeBlock.highlight')
    const selected = fixtures.filter(({ lang }) =>
      ['markdown', 'vue', 'html', 'typescript'].includes(lang || '')
    )
    const first = await Promise.all(selected.map(({ code, lang }) => highlightCode(code, lang)))
    const reversed = await Promise.all(
      [...selected].reverse().map(({ code, lang }) => highlightCode(code, lang))
    )
    expect(first.map(({ tokens }) => tokens)).toEqual(selected.map(expected))
    expect(reversed.reverse().map(({ tokens }) => tokens)).toEqual(
      first.map(({ tokens }) => tokens)
    )
    const colors = first.flatMap(({ tokens }) => tokens.flat().map(({ color }) => color))
    expect(colors).toContain('var(--code-token-keyword)')
    expect(colors.every((color) => !color || color.startsWith('var(--'))).toBe(true)
  })

  it('surfaces supported grammar loading failures', async () => {
    const { highlightCode } = await import('./CodeBlock.highlight')
    await highlightCode('echo hello', 'bash')
    const highlighter = await create.mock.results[0].value
    const failure = new Error('Grammar could not be loaded')
    vi.spyOn(highlighter, 'loadLanguage').mockImplementation(async (...languages) => {
      if (languages.length) throw failure
    })
    await expect(highlightCode('select 42', 'sql')).rejects.toBe(failure)
    expect(create).toHaveBeenCalledTimes(1)
  })

  it('retains native singleton initialization failure without adding retries', async () => {
    const failure = new Error('Highlighter could not be initialized')
    create.mockRejectedValue(failure)
    const { highlightCode } = await import('./CodeBlock.highlight')
    await expect(highlightCode('echo hello', 'bash')).rejects.toBe(failure)
    await expect(highlightCode('select 42', 'sql')).rejects.toBe(failure)
    expect(create).toHaveBeenCalledTimes(1)
  })
})
