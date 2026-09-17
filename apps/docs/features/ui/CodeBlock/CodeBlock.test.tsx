import { readFile } from 'node:fs/promises'
import { load } from 'cheerio'
import { type ComponentProps, type PropsWithChildren } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createHighlighter, type BundledLanguage, type ThemeRegistration } from 'shiki'
import { createTwoslasher } from 'twoslash'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { CodeBlock } from './CodeBlock'
import { type CodeToken } from './CodeBlock.client'
import { getTokenClassName } from './CodeBlock.utils'

vi.mock('./types/lib.deno.d.ts.include', async () => ({
  default: await readFile(new URL('./types/lib.deno.d.ts.include', import.meta.url), 'utf8'),
}))

// Keep the real token renderer while isolating unrelated UI imports and tooltip portals.
vi.mock('ui', async () => {
  const { createElement } = await import('react')
  return {
    cn: (...classes: Array<unknown>) => classes.filter(Boolean).join(' '),
    Tooltip: ({ children }: PropsWithChildren) => children,
    TooltipTrigger: ({ children }: PropsWithChildren) => children,
    TooltipContent: () => null,
    Button: ({ variant, ...props }: ComponentProps<'button'> & { variant?: string }) =>
      createElement('button', props),
    copyToClipboard: vi.fn(),
  }
})

function getLines(block: Awaited<ReturnType<typeof CodeBlock>>): Array<Array<CodeToken>> {
  return block.props.children[0].props.children.props.lines
}

const fixtures: Array<{ name: string; lang?: string; code: string }> = [
  {
    name: 'JavaScript',
    lang: 'javascript',
    code: '// A greeting\nconst greeting = "hello"\ngreeting',
  },
  {
    name: 'TypeScript',
    lang: 'typescript',
    code: 'const count: number = 42\nconst values = [count]',
  },
  { name: 'SQL', lang: 'sql', code: "select 'hello' as greeting, 42 as count;\n-- A comment" },
  { name: 'shell', lang: 'shell', code: 'echo "hello ${USER}"\n# A comment' },
  { name: 'JSON', lang: 'json', code: '{\n  "greeting": "hello",\n  "count": 42\n}' },
  { name: 'empty code', lang: 'typescript', code: '' },
  { name: 'plain text', code: 'plain <text> & punctuation\n  second line' },
  { name: 'unsupported language', lang: 'not-a-language', code: 'plain <text> & punctuation' },
]

describe('code block serialization and rendering', () => {
  let highlighter: Awaited<ReturnType<typeof createHighlighter>>

  beforeAll(async () => {
    // Shiki mutates theme.colors, so use a fresh raw theme for this independent tokenization.
    const theme: ThemeRegistration = JSON.parse(
      await readFile(new URL('./supabase-2.json', import.meta.url), 'utf8')
    )
    highlighter = await createHighlighter({
      themes: [theme],
      langs: ['javascript', 'typescript', 'sql', 'shell', 'json'],
    })
  })

  afterEach(() => vi.restoreAllMocks())
  afterAll(() => highlighter.dispose())

  it.each(fixtures)(
    'preserves $name token boundaries using compact namespaced classes',
    async ({ lang, code }) => {
      const block = await CodeBlock({
        contents: code,
        lang,
        skipTypeGeneration: true,
        hideControls: true,
      })
      const lines = getLines(block)
      const { tokens } = highlighter.codeToTokens(code, {
        lang: lang === 'not-a-language' ? undefined : (lang as BundledLanguage | undefined),
        theme: 'Supabase Theme',
        tokenizeTimeLimit: 0,
        tokenizeMaxLineLength: 100_000,
      })

      expect(lines.map((line) => line.map(([content]) => content))).toEqual(
        tokens.map((line) => line.map(({ content }) => content))
      )
      for (const [lineIndex, line] of tokens.entries()) {
        for (const [tokenIndex, token] of line.entries()) {
          expect(lines[lineIndex][tokenIndex]).toEqual([
            token.content,
            getTokenClassName(token.color, token.fontStyle),
          ])
        }
      }

      const $ = load(renderToStaticMarkup(block))
      expect(
        $('.code-line-number')
          .toArray()
          .map((element) => $(element).text())
      ).toEqual(lines.map((_, index) => String(index + 1)))
      expect(
        $('.code-line-content')
          .toArray()
          .map((element) => $(element).text())
      ).toEqual(lines.map((line) => line.map(([content]) => content).join('')))
      expect($('.code-content [style]')).toHaveLength(0)
    }
  )

  it('preserves actual Twoslash annotations and offsets after its source edits', async () => {
    const source = [
      "const prefix = 'Hello'",
      '// ---cut---',
      '/** The name shown in the greeting. */',
      "const username = 'reader'",
      'const message = `${prefix}, ${username}`',
      'message',
    ].join('\n')
    const twoslashed = createTwoslasher({ compilerOptions: { ignoreDeprecations: '6.0' } })(source)
    const hovers = twoslashed.nodes.filter((node) => node.type === 'hover')
    expect(hovers.length).toBeGreaterThan(0)
    expect(twoslashed.code).not.toContain('// ---cut---')

    const block = await CodeBlock({ contents: source, lang: 'typescript', hideControls: true })
    const lines = getLines(block)
    expect(lines.map((line) => line.map(([content]) => content).join('')).join('\n')).toBe(
      twoslashed.code
    )

    for (const [lineIndex, line] of lines.entries()) {
      let offset = 0
      for (const token of line) {
        const annotations = hovers
          .filter((hover) => hover.line === lineIndex && hover.character === offset)
          .map(({ text, docs, tags }) => ({ text, docs, tags }))
        expect(token[2]).toEqual(annotations.length ? annotations : undefined)
        expect(token).toHaveLength(annotations.length ? 3 : 2)
        offset += token[0].length
      }
    }
    const annotated = lines.flat().filter((token) => token[2])
    expect(annotated.length).toBeGreaterThan(0)
    const $ = load(renderToStaticMarkup(block))
    expect(
      $('.code-content button')
        .toArray()
        .map((element) => $(element).text())
    ).toEqual(annotated.map(([content]) => content))
    expect($('.code-content button[tabindex="0"]')).toHaveLength(annotated.length)
  })

  it('keeps classes stable across repeated renders in a different order', async () => {
    const render = async ({ lang, code }: (typeof fixtures)[number]) =>
      getLines(await CodeBlock({ contents: code, lang, skipTypeGeneration: true }))
    const first = await Promise.all(fixtures.map(render))
    const reversed = await Promise.all([...fixtures].reverse().map(render))
    expect(reversed.reverse()).toEqual(first)
  })

  it('retains unnumbered layout, source text, hidden controls, and the accessible label', async () => {
    const code = 'echo "hello"\necho "reader"'
    const block = await CodeBlock({
      contents: code,
      lang: 'shell',
      lineNumbers: false,
      hideControls: true,
    })
    const $ = load(renderToStaticMarkup(block))
    expect($('.code-line-number')).toHaveLength(0)
    expect($('.code-content')).toHaveLength(1)
    expect(
      $('.code-content > span')
        .toArray()
        .map((element) => $(element).text())
        .join('\n')
    ).toBe(code)
    expect($('button')).toHaveLength(0)
    expect($('.code-scroll').attr('aria-label')).toBe('Shell, 2 lines')
    expect($('.code-scroll').attr('tabindex')).toBe('0')
    expect($('pre > code').hasClass('grid')).toBe(false)
  })
})
