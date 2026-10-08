import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { getInternalLinkBaseUrl, renderPageMarkdown } from './generate-markdown.mjs'

// Mirrors the markup Layout.astro + GuideLayout.astro render around a guide:
// site chrome in header/footer, the article in <main>, and an Admonition alert.
function renderPage(articleBody) {
  return `<!DOCTYPE html><html lang="en"><head><title>Sample | Supabase Knowledge Base</title></head><body>
<header><nav><a href="/kb/topics/auth">Site navigation</a></nav></header>
<main><article class="prose">${articleBody}</article></main>
<footer>Site footer text</footer>
</body></html>`
}

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

describe('renderPageMarkdown', () => {
  const ORIGINAL_ENV = process.env

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, VERCEL_ENV: 'production' }
  })

  afterEach(() => {
    process.env = ORIGINAL_ENV
  })

  it('exports the title as an h1 and the lead paragraph beneath it, without site chrome', () => {
    const markdown = renderPageMarkdown(
      renderPage('<h1>Sample guide</h1><p class="lead">A short summary.</p><p>Body text.</p>')
    )

    expect(markdown).toBe('# Sample guide\n\nA short summary.\n\nBody text.\n')
    expect(markdown).not.toContain('Site navigation')
    expect(markdown).not.toContain('Site footer text')
  })

  it('turns an internal guide/topic link into an absolute link to its markdown export', () => {
    const markdown = renderPageMarkdown(
      renderPage('<h1>T</h1><p><a href="/kb/guides/other-guide" title="Other">Other guide</a></p>')
    )

    expect(markdown).toContain(
      '[Other guide](https://supabase.com/kb/guides/other-guide.md "Other")'
    )
  })

  it('makes other root-relative links absolute without adding the kb base path', () => {
    const markdown = renderPageMarkdown(
      renderPage('<h1>T</h1><p><a href="/docs/guides/auth">Auth docs</a></p>')
    )

    expect(markdown).toContain('[Auth docs](https://supabase.com/docs/guides/auth)')
  })

  it('leaves external and anchor links unchanged', () => {
    const markdown = renderPageMarkdown(
      renderPage(
        '<h1>T</h1><p><a href="https://example.com/guide">External</a> <a href="#section">Jump</a></p>'
      )
    )

    expect(markdown).toContain('[External](https://example.com/guide)')
    expect(markdown).toContain('[Jump](#section)')
  })

  it('keeps internal links relative outside of Vercel', () => {
    delete process.env.VERCEL_ENV

    const markdown = renderPageMarkdown(
      renderPage('<h1>T</h1><p><a href="/kb/guides/other-guide">Other guide</a></p>')
    )

    expect(markdown).toContain('[Other guide](/kb/guides/other-guide.md)')
  })

  it('restores the GitHub alert marker for each Admonition type', () => {
    const alert = (label, text) =>
      `<div data-slot="alert" role="alert" aria-label="${label}"><div><div data-slot="alert-description"><p>${text}</p></div></div></div>`

    const markdown = renderPageMarkdown(
      renderPage(
        `<h1>T</h1>${alert('Note', 'Useful.')}${alert('Success', 'Advice.')}${alert('Warning', 'Important.')}${alert('Danger', 'Risky.')}${alert('Caution', 'Careful.')}`
      )
    )

    expect(markdown).toContain('> [!NOTE]\n> Useful.')
    expect(markdown).toContain('> [!TIP]\n> Advice.')
    expect(markdown).toContain('> [!IMPORTANT]\n> Important.')
    expect(markdown).toContain('> [!WARNING]\n> Risky.')
    expect(markdown).toContain('> [!CAUTION]\n> Careful.')
  })

  it('keeps a multi-paragraph alert inside one blockquote', () => {
    const markdown = renderPageMarkdown(
      renderPage(
        '<h1>T</h1><div data-slot="alert" role="alert" aria-label="Note"><div><div data-slot="alert-description"><p>First.</p><p>Second.</p></div></div></div>'
      )
    )

    expect(markdown).toContain('> [!NOTE]\n> First.\n>\n> Second.')
  })

  it('renders GFM tables and fenced code blocks', () => {
    const markdown = renderPageMarkdown(
      renderPage(
        '<h1>T</h1><table><thead><tr><th>Name</th><th>Value</th></tr></thead><tbody><tr><td>a</td><td>1</td></tr></tbody></table><pre><code class="language-bash">npm install</code></pre>'
      )
    )

    expect(markdown).toContain('| Name | Value |')
    expect(markdown).toContain('| a | 1 |')
    expect(markdown).toContain('npm install')
    expect(markdown).toContain('```')
  })
})
