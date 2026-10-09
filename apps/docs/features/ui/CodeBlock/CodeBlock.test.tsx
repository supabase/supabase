import { load } from 'cheerio'
import { type ComponentProps, type PropsWithChildren } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CodeBlock } from './CodeBlock'
import { type CodeToken } from './CodeBlock.client'
import { highlightCode } from './CodeBlock.highlight'

const { twoslasher } = vi.hoisted(() => ({ twoslasher: vi.fn() }))

vi.mock('./CodeBlock.highlight', () => ({ highlightCode: vi.fn() }))
vi.mock('twoslash', () => ({ createTwoslasher: () => twoslasher }))
vi.mock('./types/lib.deno.d.ts.include', () => ({ default: '' }))

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

describe('code block serialization and rendering', () => {
  const highlight = vi.mocked(highlightCode, { partial: true })

  beforeEach(() => {
    highlight.mockReset().mockImplementation(async (code) => ({
      tokens: code
        .split('\n')
        .map((content) =>
          content ? [{ content, offset: 0, color: 'var(--code-foreground)' }] : []
        ),
    }))
    twoslasher.mockReset().mockImplementation((code: string) => ({ code, nodes: [] }))
  })

  it('serializes compact classes and renders numbered, escaped source without inline styles', async () => {
    const code = "const text = '<hello> & world'\n// note"
    highlight.mockResolvedValueOnce({
      tokens: [
        [
          { content: 'const ', offset: 0, color: 'var(--code-token-keyword)' },
          { content: "text = '<hello> & world'", offset: 6, color: 'var(--code-token-string)' },
        ],
        [{ content: '// note', offset: 31, color: 'var(--code-token-comment)', fontStyle: 1 }],
      ],
    })
    const block = await CodeBlock({
      contents: code,
      lang: 'javascript',
      skipTypeGeneration: true,
      hideControls: true,
    })

    expect(twoslasher).not.toHaveBeenCalled()
    expect(getLines(block)).toEqual([
      [
        ['const ', 's-k'],
        ["text = '<hello> & world'", 's-s'],
      ],
      [['// note', 's-c s-i']],
    ])
    const $ = load(renderToStaticMarkup(block))
    expect(
      $('.code-line-number')
        .toArray()
        .map((element) => $(element).text())
    ).toEqual(['1', '2'])
    expect(
      $('.code-line-content')
        .toArray()
        .map((element) => $(element).text())
    ).toEqual(code.split('\n'))
    expect($('.code-content .s-k').text()).toBe('const ')
    expect($('.code-content .s-c.s-i').text()).toBe('// note')
    expect($('.code-content [style]')).toHaveLength(0)
  })

  it.each([
    { name: 'plain text', lang: undefined, code: 'plain <text> & punctuation', expectedLang: null },
    {
      name: 'unsupported language',
      lang: 'not-a-language',
      code: 'plain text',
      expectedLang: null,
    },
    { name: 'empty code', lang: 'typescript', code: '', expectedLang: 'typescript' },
    { name: 'language alias', lang: 'ts', code: 'const count = 42', expectedLang: 'ts' },
  ])('handles $name', async ({ lang, code, expectedLang }) => {
    const block = await CodeBlock({
      contents: code,
      lang,
      skipTypeGeneration: true,
      hideControls: true,
    })
    expect(highlight).toHaveBeenCalledWith(code, expectedLang)
    const $ = load(renderToStaticMarkup(block))
    expect($('.code-line-content').text()).toBe(code)
  })

  it('highlights edited Twoslash source and attaches hovers at the correct token offsets', async () => {
    const source = 'const hidden = 0\n// ---cut---\nconst count = 42\ncount'
    const edited = 'const count = 42\ncount'
    const annotation = { text: 'const count: 42', docs: 'The current count.', tags: undefined }
    twoslasher.mockReturnValueOnce({
      code: edited,
      nodes: [
        { type: 'hover', line: 0, character: 6, ...annotation },
        { type: 'hover', line: 1, character: 0, ...annotation },
      ],
    })
    highlight.mockResolvedValueOnce({
      tokens: [
        [
          { content: 'const ', offset: 0, color: 'var(--code-token-keyword)' },
          { content: 'count', offset: 6, color: 'var(--code-token-variable)' },
          { content: ' = 42', offset: 11 },
        ],
        [{ content: 'count', offset: 17, color: 'var(--code-token-variable)' }],
      ],
    })
    const block = await CodeBlock({ contents: source, lang: 'typescript', hideControls: true })

    expect(twoslasher).toHaveBeenCalledWith(source)
    expect(highlight).toHaveBeenCalledWith(edited, 'typescript')
    expect(getLines(block)).toEqual([
      [
        ['const ', 's-k'],
        ['count', 's-v', [annotation]],
        [' = 42', undefined],
      ],
      [['count', 's-v', [annotation]]],
    ])
    const $ = load(renderToStaticMarkup(block))
    expect(
      $('.code-content button')
        .toArray()
        .map((element) => $(element).text())
    ).toEqual(['count', 'count'])
    expect($('.code-content button[tabindex="0"]')).toHaveLength(2)
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
