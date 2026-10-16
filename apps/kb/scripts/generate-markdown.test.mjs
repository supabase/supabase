import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { getInternalLinkBaseUrl, htmlToMarkdown, toMarkdownPath } from './generate-markdown.mjs'

const PAGE_HTML = `<!doctype html>
<html>
  <head>
    <title>Sample guide | Supabase Knowledge Base</title>
    <meta name="description" content="A short summary." />
  </head>
  <body>
    <nav><a href="/kb/topics/auth">Site navigation link</a></nav>
    <main>
      <article>
        <h1>Sample guide</h1>
        <p>Body text with a <a href="/kb/guides/other-guide">related guide</a>.</p>
      </article>
    </main>
    <footer>Site footer text</footer>
  </body>
</html>`

// Wraps body HTML in a main element so extract: true keeps it.
function main(bodyHtml) {
  return `<main><article>${bodyHtml}</article></main>`
}

describe('toMarkdownPath', () => {
  it('maps a page index.html to a sibling .md file named after its route', () => {
    expect(toMarkdownPath('guides/sample-guide/index.html')).toBe('guides/sample-guide.md')
  })

  it('keeps nested routes intact', () => {
    expect(toMarkdownPath('guides/database/tables/index.html')).toBe('guides/database/tables.md')
  })
})

// Mirrors the markup <Admonition> renders (packages/ui-patterns), with the
// class lists and icon path trimmed to keep the fixture readable.
function admonitionHtml(label, bodyHtml) {
  return `<div data-slot="alert" role="alert" class="relative w-full rounded-lg border p-4" aria-label="${label}"><div class="flex items-start gap-3"><span class="inline-flex"><svg viewBox="0 0 21 20" aria-hidden="true"><path d="M0 0"></path></svg></span><div class="min-w-0 flex-1 flex flex-col"><div class="mt-0.5"><div data-slot="alert-description" class="text-sm">${bodyHtml}</div></div></div></div></div>`
}

describe('htmlToMarkdown callouts', () => {
  const ORIGINAL_ENV = process.env

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, VERCEL_ENV: 'production' }
  })

  afterEach(() => {
    process.env = ORIGINAL_ENV
  })

  it('converts a Note admonition into a GitHub NOTE alert and drops the icon', () => {
    const markdown = htmlToMarkdown(main(admonitionHtml('Note', '<p>Body of the note.</p>')))

    expect(markdown).toContain('> [!NOTE]\n> Body of the note.')
    expect(markdown).not.toContain('<svg')
    expect(markdown).not.toContain('aria-label')
  })

  it('keeps multi-paragraph and bulleted callout bodies inside the blockquote', () => {
    const markdown = htmlToMarkdown(
      main(
        admonitionHtml(
          'Caution',
          '<p><strong>Heads up</strong></p><p>Second paragraph.</p><ul><li>First</li></ul>'
        )
      )
    )

    expect(markdown).toContain('> [!CAUTION]\n> **Heads up**\n>\n> Second paragraph.')
    expect(markdown).toContain('> - First')
  })

  it('maps each Admonition label back to the source marker that produced it', () => {
    const markdown = htmlToMarkdown(
      main(
        `${admonitionHtml('Success', '<p>Tip body.</p>')}${admonitionHtml('Warning', '<p>Important body.</p>')}${admonitionHtml('Danger', '<p>Warning body.</p>')}`
      )
    )

    expect(markdown).toContain('> [!TIP]\n> Tip body.')
    expect(markdown).toContain('> [!IMPORTANT]\n> Important body.')
    expect(markdown).toContain('> [!WARNING]\n> Warning body.')
  })
})

describe('htmlToMarkdown', () => {
  const ORIGINAL_ENV = process.env

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, VERCEL_ENV: 'production' }
  })

  afterEach(() => {
    process.env = ORIGINAL_ENV
  })

  it('keeps the main content and drops the surrounding site chrome', () => {
    const markdown = htmlToMarkdown(PAGE_HTML)

    expect(markdown).toContain('# Sample guide')
    expect(markdown).toContain('Body text with a')
    expect(markdown).not.toContain('Site navigation link')
    expect(markdown).not.toContain('Site footer text')
  })

  it('does not prepend frontmatter from <head>', () => {
    const markdown = htmlToMarkdown(PAGE_HTML)

    expect(markdown.startsWith('# Sample guide')).toBe(true)
    expect(markdown).not.toContain('---')
    expect(markdown).not.toContain('description:')
  })

  it('absolutizes root-relative links in the body', () => {
    expect(htmlToMarkdown(PAGE_HTML)).toContain(
      '[related guide](https://supabase.com/kb/guides/other-guide)'
    )
  })

  it('leaves already-absolute links untouched', () => {
    expect(htmlToMarkdown(main('<a href="https://example.com/guide">the docs</a>'))).toContain(
      '[the docs](https://example.com/guide)'
    )
  })

  it('does not double up the base path when a link already includes it', () => {
    expect(htmlToMarkdown(main('<a href="/kb/guides/other-guide">another guide</a>'))).toContain(
      '[another guide](https://supabase.com/kb/guides/other-guide)'
    )
  })

  it('keeps a link title as the markdown title', () => {
    expect(
      htmlToMarkdown(main('<a href="/guides/other-guide" title="Other">another guide</a>'))
    ).toContain('[another guide](https://supabase.com/kb/guides/other-guide "Other")')
  })

  it('wraps a destination containing a space in angle brackets', () => {
    expect(htmlToMarkdown(main('<a href="/guides/a guide">a guide</a>'))).toContain(
      '[a guide](<https://supabase.com/kb/guides/a guide>)'
    )
  })

  it('wraps a destination containing parentheses in angle brackets', () => {
    expect(
      htmlToMarkdown(main('<a href="https://en.wikipedia.org/wiki/Foo_(bar)">wiki</a>'))
    ).toContain('[wiki](<https://en.wikipedia.org/wiki/Foo_(bar)>)')
  })

  it('escapes angle brackets and backslashes inside a wrapped destination', () => {
    expect(htmlToMarkdown(main('<a href="https://example.com/a b\\c<d>">x</a>'))).toContain(
      '[x](<https://example.com/a b\\\\c\\<d\\>>)'
    )
  })

  it('escapes double quotes in a title', () => {
    expect(htmlToMarkdown(main('<a href="/guides/x" title="Say &quot;hi&quot;">x</a>'))).toContain(
      '[x](https://supabase.com/kb/guides/x "Say \\"hi\\"")'
    )
  })

  it('renders /docs links against supabase.com rather than the kb base path', () => {
    expect(
      htmlToMarkdown(main('<a href="/docs/reference/javascript/auth-updateuser">reference</a>'))
    ).toContain('[reference](https://supabase.com/docs/reference/javascript/auth-updateuser)')
  })

  it('renders /dashboard, /blog, and /changelog links against supabase.com', () => {
    const markdown = htmlToMarkdown(
      main(
        '<a href="/dashboard/project/_?showConnect=true&amp;method=session">connect</a>' +
          '<a href="/blog/some-post#intro">blog</a>' +
          '<a href="/changelog">changelog</a>'
      )
    )

    expect(markdown).toContain(
      '[connect](https://supabase.com/dashboard/project/_?showConnect=true&method=session)'
    )
    expect(markdown).toContain('[blog](https://supabase.com/blog/some-post#intro)')
    expect(markdown).toContain('[changelog](https://supabase.com/changelog)')
  })

  it('keeps site-section links on supabase.com in preview builds', () => {
    process.env.VERCEL_ENV = 'preview'
    process.env.VERCEL_URL = 'kb-git-fork-supabase.vercel.app'

    expect(htmlToMarkdown(main('<a href="/docs/guides">docs</a>'))).toContain(
      '[docs](https://supabase.com/docs/guides)'
    )
  })

  it('does not treat /dashboard-old as a /dashboard link', () => {
    expect(htmlToMarkdown(main('<a href="/dashboard-old">old</a>'))).toContain(
      '[old](https://supabase.com/kb/dashboard-old)'
    )
  })

  it('does not treat a path that merely starts with "docs" as a /docs link', () => {
    expect(htmlToMarkdown(main('<a href="/docsy/page">docsy</a>'))).toContain(
      '[docsy](https://supabase.com/kb/docsy/page)'
    )
  })

  it('does not rewrite image URLs', () => {
    expect(htmlToMarkdown(main('<img src="/img.png" alt="alt" />'))).toContain('/img.png')
    expect(htmlToMarkdown(main('<img src="/img.png" alt="alt" />'))).not.toContain('supabase.com')
  })

  it('leaves a root-relative URL inside a code block untouched', () => {
    const markdown = htmlToMarkdown(main('<pre><code>curl -X GET /guides/foo</code></pre>'))

    expect(markdown).toContain('curl -X GET /guides/foo')
    expect(markdown).not.toContain('supabase.com')
  })

  it('leaves the link relative (base path only, no origin) outside of Vercel', () => {
    delete process.env.VERCEL_ENV
    expect(htmlToMarkdown(main('<a href="/guides/other-guide">another guide</a>'))).toContain(
      '[another guide](/kb/guides/other-guide)'
    )
  })
})

describe('htmlToMarkdown code blocks', () => {
  // Mirrors the markup Astro renders for a fenced block: a <pre> with
  // `data-language`, and one <span class="line"> per line of code.
  const CODE_HTML =
    '<pre class="astro-code" data-language="ts"><code><span class="line"><span>const a = 1</span></span>\n<span class="line"><span>console.log(a)</span></span></code></pre>'

  it('fences the block with the language from data-language', () => {
    expect(htmlToMarkdown(main(CODE_HTML))).toContain('```ts\nconst a = 1\nconsole.log(a)\n```')
  })

  it('leaves a block without a language as a bare fence', () => {
    const markdown = htmlToMarkdown(
      main('<pre><code><span class="line">npm install</span></code></pre>')
    )

    expect(markdown).toContain('```\nnpm install\n```')
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
