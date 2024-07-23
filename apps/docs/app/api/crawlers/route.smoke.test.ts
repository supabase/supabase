import { load } from 'cheerio'
import { expect, it, describe } from 'vitest'

// const REFERENCE_DOCS_URL = 'https://supabase.com/docs/reference'
// For dev testing: comment out above and uncomment below
const REFERENCE_DOCS_URL = 'http://localhost:3001/docs/reference'

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

    const description = $('h1').next().text()
    expect(description).toBe(
      'Only relevant for range columns. Match only rows where every element in column is either contained in range or less than any element in range.'
    )

    const headings = [] as Array<string | undefined>
    $('h2').map(function () {
      headings.push($(this).attr('id'))
    })

    expect(headings.includes('parameters')).toBe(true)
    expect(headings.includes('examples')).toBe(true)
  })
})
