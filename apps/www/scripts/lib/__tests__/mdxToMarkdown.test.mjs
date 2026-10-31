// @ts-check
import { describe, expect, it } from 'vitest'

import { mdxBodyToMarkdown } from '../mdxToMarkdown.mjs'

describe('mdxBodyToMarkdown', () => {
  it('preserves plain markdown unchanged', async () => {
    const out = await mdxBodyToMarkdown('# Title\n\nA **bold** word.')
    expect(out).toContain('# Title')
    expect(out).toContain('**bold**')
  })

  it('preserves code fences containing JSX literally', async () => {
    const src = [
      '```tsx',
      'function App() {',
      '  return <Quote caption="x">hi</Quote>',
      '}',
      '```',
    ].join('\n')
    const out = await mdxBodyToMarkdown(src)
    expect(out).toContain('<Quote caption="x">hi</Quote>')
    expect(out).toContain('```tsx')
  })

  it('rewrites <Img /> to a markdown image', async () => {
    const out = await mdxBodyToMarkdown('<Img src="/x.png" alt="X" />')
    expect(out.trim()).toBe('![X](/x.png)')
  })

  it('rewrites <Img /> without alt', async () => {
    const out = await mdxBodyToMarkdown('<Img src="/x.png" />')
    expect(out.trim()).toBe('![](/x.png)')
  })

  it('rewrites <Admonition> to a labeled blockquote', async () => {
    const out = await mdxBodyToMarkdown('<Admonition type="note">\n\nHeads up.\n\n</Admonition>')
    expect(out).toMatch(/^>\s+\*\*NOTE\*\*/m)
    expect(out).toContain('Heads up.')
  })

  it('rewrites <Quote> with caption to a blockquote with em-dash attribution', async () => {
    const out = await mdxBodyToMarkdown(
      '<Quote caption="Jane Doe, CEO">\n\nIt was great.\n\n</Quote>'
    )
    expect(out).toContain('> It was great.')
    expect(out).toContain('*— Jane Doe, CEO*')
  })

  it('rewrites <Link href> to a markdown link', async () => {
    const out = await mdxBodyToMarkdown('<Link href="/x">click</Link>')
    expect(out.trim()).toBe('[click](/x)')
  })

  it('rewrites <Subtitle> and <Badge> to bold', async () => {
    const out = await mdxBodyToMarkdown('<Subtitle>foo</Subtitle> <Badge>bar</Badge>')
    expect(out).toContain('**foo**')
    expect(out).toContain('**bar**')
  })

  it('drops <Avatar> entirely', async () => {
    const out = await mdxBodyToMarkdown('<Avatar src="/x" /> rest')
    expect(out).not.toContain('Avatar')
    expect(out).toContain('rest')
  })

  it('flattens unknown inline JSX to text, preserving inner content', async () => {
    const out = await mdxBodyToMarkdown('Some text with <Mystery>kept</Mystery> inline.')
    expect(out).toContain('kept')
    expect(out).toContain('Some text with')
    expect(out).toContain('inline.')
    expect(out).not.toContain('<Mystery')
    expect(out).not.toContain('</Mystery')
  })

  it('strips MDX comments {/* ... */}', async () => {
    const out = await mdxBodyToMarkdown('hello {/* internal note */} world')
    expect(out).toContain('hello')
    expect(out).toContain('world')
    expect(out).not.toContain('internal')
  })

  it('strips orphan mdxjsEsm imports at the top level', async () => {
    const src = "import X from 'y'\n\n# Title"
    const out = await mdxBodyToMarkdown(src)
    expect(out).toContain('# Title')
    expect(out).not.toContain('import')
  })
})
