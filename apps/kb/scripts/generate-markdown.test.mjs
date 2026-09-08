import { describe, expect, it } from 'vitest'

import { absolutizeLinks, parseFrontmatter, renderMarkdown } from './generate-markdown.mjs'

describe('parseFrontmatter', () => {
  it('parses title/description out of the YAML frontmatter and returns the rest as body', () => {
    const raw = `---\ntitle: 'Sample guide'\ndescription: 'A short summary.'\n---\n\nBody text here.\n`

    const { data, body } = parseFrontmatter(raw)

    expect(data.title).toBe('Sample guide')
    expect(data.description).toBe('A short summary.')
    // The blank line separating the closing `---` from the body is kept as-is
    // here — renderMarkdown() is what trims it before composing the output.
    expect(body).toBe('\nBody text here.\n')
  })

  it('parses values that would trip up a naive regex (colons and quotes in the text)', () => {
    const raw = `---\ntitle: "Note: this has a colon"\ndescription: "Quoted 'inner' text: still one value"\n---\nBody\n`

    const { data } = parseFrontmatter(raw)

    expect(data.title).toBe('Note: this has a colon')
    expect(data.description).toBe("Quoted 'inner' text: still one value")
  })

  it('returns an empty data object and the raw text untouched when there is no frontmatter', () => {
    const raw = 'Just a plain paragraph, no frontmatter.\n'

    const { data, body } = parseFrontmatter(raw)

    expect(data).toEqual({})
    expect(body).toBe(raw)
  })
})

describe('absolutizeLinks', () => {
  it('leaves already-absolute links untouched', () => {
    const body = 'See [the docs](https://example.com/guide) for more.'

    expect(absolutizeLinks(body)).toBe(body)
  })

  it('rewrites a root-relative link into a full URL under the kb base path', () => {
    const body = 'See [another guide](/guides/other-guide) for more.'

    expect(absolutizeLinks(body)).toBe(
      'See [another guide](https://supabase.com/kb/guides/other-guide) for more.'
    )
  })

  it('does not double up the base path when a link already includes it', () => {
    const body = '[another guide](/kb/guides/other-guide)'

    expect(absolutizeLinks(body)).toBe(
      '[another guide](https://supabase.com/kb/guides/other-guide)'
    )
  })
})

describe('renderMarkdown', () => {
  it('turns the title into an h1 and the description into the paragraph beneath it', () => {
    const data = { title: 'Sample guide', description: 'A short summary.' }

    expect(renderMarkdown(data, 'Body text.')).toBe(
      '# Sample guide\n\nA short summary.\n\nBody text.\n'
    )
  })

  it('skips the heading/lead lines gracefully when title or description are missing', () => {
    expect(renderMarkdown({}, 'Body text.')).toBe('Body text.\n')
  })
})
