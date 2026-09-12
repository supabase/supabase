import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  absolutizeLinks,
  getInternalLinkBaseUrl,
  parseFrontmatter,
  renderMarkdown,
  renderTopicMarkdown,
} from './generate-markdown.mjs'

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

describe('getInternalLinkBaseUrl', () => {
  const ORIGINAL_ENV = process.env

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV }
    delete process.env.VERCEL_ENV
    delete process.env.VERCEL_URL
  })

  afterEach(() => {
    process.env = ORIGINAL_ENV
  })

  it('returns the production origin when VERCEL_ENV=production', () => {
    process.env.VERCEL_ENV = 'production'
    expect(getInternalLinkBaseUrl()).toBe('https://supabase.com')
  })

  it('returns the deployment URL when VERCEL_ENV=preview', () => {
    process.env.VERCEL_ENV = 'preview'
    process.env.VERCEL_URL = 'kb-git-fork-supabase.vercel.app'
    expect(getInternalLinkBaseUrl()).toBe('https://kb-git-fork-supabase.vercel.app')
  })

  it('returns empty when preview is set but VERCEL_URL is missing', () => {
    process.env.VERCEL_ENV = 'preview'
    expect(getInternalLinkBaseUrl()).toBe('')
  })

  it('returns empty when VERCEL_ENV is not set (local dev/CI)', () => {
    expect(getInternalLinkBaseUrl()).toBe('')
  })
})

describe('absolutizeLinks', () => {
  const ORIGINAL_ENV = process.env

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, VERCEL_ENV: 'production' }
  })

  afterEach(() => {
    process.env = ORIGINAL_ENV
  })

  it('leaves already-absolute links untouched', () => {
    expect(absolutizeLinks('See [the docs](https://example.com/guide) for more.')).toBe(
      'See [the docs](https://example.com/guide) for more.\n'
    )
  })

  it('rewrites a root-relative link into a full URL under the kb base path', () => {
    expect(absolutizeLinks('See [another guide](/guides/other-guide) for more.')).toBe(
      'See [another guide](https://supabase.com/kb/guides/other-guide) for more.\n'
    )
  })

  it('does not double up the base path when a link already includes it', () => {
    expect(absolutizeLinks('[another guide](/kb/guides/other-guide)')).toBe(
      '[another guide](https://supabase.com/kb/guides/other-guide)\n'
    )
  })

  it('leaves the link relative (base path only, no origin) outside of Vercel', () => {
    process.env.VERCEL_ENV = undefined
    expect(absolutizeLinks('[another guide](/guides/other-guide)')).toBe(
      '[another guide](/kb/guides/other-guide)\n'
    )
  })

  it('does not rewrite image URLs', () => {
    expect(absolutizeLinks('![alt](/img.png)')).toBe('![alt](/img.png)\n')
  })

  it('skips link-like text inside fenced code blocks', () => {
    expect(absolutizeLinks('```\n[x](/x)\n```\n\n[y](/y)')).toBe(
      '```\n[x](/x)\n```\n\n[y](https://supabase.com/kb/y)\n'
    )
  })

  it('leaves a root-relative URL inside a fenced code block untouched, even outside link syntax', () => {
    const body = '```bash\ncurl -X GET /guides/foo\n```'
    expect(absolutizeLinks(body)).toBe('```bash\ncurl -X GET /guides/foo\n```\n')
  })

  it('leaves a root-relative URL inside a fenced markdown code block untouched', () => {
    const body = '```md\n[Guides](/guides/foo)\n```'
    expect(absolutizeLinks(body)).toBe('```md\n[Guides](/guides/foo)\n```\n')
  })

  it('leaves a root-relative URL inside an inline code span untouched', () => {
    expect(absolutizeLinks('Run `GET /guides/foo` to fetch it.')).toBe(
      'Run `GET /guides/foo` to fetch it.\n'
    )
  })

  it('round-trips GFM tables and strikethrough without mangling them', () => {
    const body = '| a | b |\n| - | - |\n| 1 | 2 |\n\n~~gone~~'
    expect(absolutizeLinks(body)).toBe('| a | b |\n| - | - |\n| 1 | 2 |\n\n~~gone~~\n')
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

describe('renderTopicMarkdown', () => {
  const topic = { name: 'Tutorial', description: 'Step-by-step walkthroughs.' }

  it('renders the topic as an h1/description followed by a bullet list of its guides', () => {
    const guides = [
      { title: 'Sample guide', url: 'https://supabase.com/kb/guides/sample-guide.md' },
    ]

    expect(renderTopicMarkdown(topic, guides)).toBe(
      '# Tutorial\n\nStep-by-step walkthroughs.\n\n- [Sample guide](https://supabase.com/kb/guides/sample-guide.md)\n'
    )
  })

  it('falls back to "No guides for this topic" when the list is empty', () => {
    expect(renderTopicMarkdown(topic, [])).toBe(
      '# Tutorial\n\nStep-by-step walkthroughs.\n\nNo guides for this topic\n'
    )
  })
})
