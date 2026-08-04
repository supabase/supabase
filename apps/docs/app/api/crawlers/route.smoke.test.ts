import { load } from 'cheerio'
import { describe, expect, it } from 'vitest'

const REFERENCE_DOCS_URL = 'https://supabase.com/docs/reference'
// For dev testing: comment out above and uncomment below
// const REFERENCE_DOCS_URL = 'http://localhost:3001/docs/reference'

describe('prod smoke test: crawler pages return correct data', () => {
  /**
   * No special tricks required to spoof the user agent. Tests are correctly
   * detected as coming from bots. If they ever aren't, the `h1` test will fail
   * as a different `h1` is served to non-bots.
   */

  it('metadata: title, description, canonical, image', async () => {
    const result = await fetch(REFERENCE_DOCS_URL + '/javascript/rangelte')
    const text = await result.text()

    const $ = load(text)
    const title = $('title').text()
    expect(title).toBe('JavaScript: Less than or equal to a range | Supabase Docs')

    const metaDescription = $('meta[name="description"]')
    expect(metaDescription.attr('content')).toBe(
      'Supabase API reference for JavaScript: Less than or equal to a range'
    )

    const canonical = $('link[rel="canonical"]')
    expect(canonical.attr('href')).toBe('https://supabase.com/docs/reference/javascript/rangelte')

    const ogImage = $('meta[name="og:image"]')
    expect(ogImage.attr('content')).toBe('https://supabase.com/docs/img/supabase-og-image.png')

    const twitterImage = $('meta[name="twitter:image"]')
    expect(twitterImage.attr('content')).toBe('https://supabase.com/docs/img/supabase-og-image.png')
  })

  it('markdown pages', async () => {
    const result = await fetch(REFERENCE_DOCS_URL + '/javascript/introduction')
    const text = await result.text()

    const $ = load(text)
    const h1 = $('h1').text()
    expect(h1).toBe('JavaScript: Introduction')

    const firstPara = $('h1').next().text()
    expect(/JavaScript library/.test(firstPara)).toBe(true)
    expect(/supabase-js/.test(firstPara)).toBe(true)
  })

  it('function pages', async () => {
    const result = await fetch(REFERENCE_DOCS_URL + '/javascript/rangelte')
    const text = await result.text()

    const $ = load(text)
    const h1 = $('h1').text()
    expect(h1).toBe('JavaScript: Less than or equal to a range')

    // Collect all heading text (h2 + h3)
    const headings: string[] = []
    $('h2, h3').each(function () {
      headings.push($(this).text().toLowerCase())
    })

    expect(headings.some((h) => h.includes('parameters'))).toBe(true)
    expect(headings.some((h) => h.includes('example'))).toBe(true)
  })
})

describe('prod smoke test: ref pages without crawler versions', async () => {
  it('returns 200', async () => {
    const result = await fetch(REFERENCE_DOCS_URL + '/api/v1-deploy-a-function')
    expect(result.status).toBe(200)
  })
})
