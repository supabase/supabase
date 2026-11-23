import { describe, expect, it } from 'vitest'

import { faqPageSchema, markdownLinksToHtml, serializeJsonLd } from './json-ld'

describe('markdownLinksToHtml', () => {
  it('converts absolute markdown links to anchors', () => {
    expect(markdownLinksToHtml('See the [usage page](https://supabase.com/dashboard) now.')).toBe(
      'See the <a href="https://supabase.com/dashboard">usage page</a> now.'
    )
  })

  it('makes relative links absolute', () => {
    expect(
      markdownLinksToHtml('See our [Billing FAQ](/docs/guides/platform/billing-faq#taxes).')
    ).toBe(
      'See our <a href="https://supabase.com/docs/guides/platform/billing-faq#taxes">Billing FAQ</a>.'
    )
  })

  it('converts multiple links and leaves plain text alone', () => {
    expect(markdownLinksToHtml('[a](https://a.test) and [b](/b)')).toBe(
      '<a href="https://a.test">a</a> and <a href="https://supabase.com/b">b</a>'
    )
    expect(markdownLinksToHtml('No links here.')).toBe('No links here.')
  })
})

describe('faqPageSchema', () => {
  it('builds a FAQPage with one Question per item', () => {
    const schema = faqPageSchema([
      { question: 'Q1?', answer: 'A1' },
      { question: 'Q2?', answer: 'See [docs](/docs)' },
    ])

    expect(schema['@type']).toBe('FAQPage')
    expect(schema.mainEntity).toEqual([
      { '@type': 'Question', name: 'Q1?', acceptedAnswer: { '@type': 'Answer', text: 'A1' } },
      {
        '@type': 'Question',
        name: 'Q2?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'See <a href="https://supabase.com/docs">docs</a>',
        },
      },
    ])
  })

  it('serializes without a raw closing script tag', () => {
    const html = serializeJsonLd(faqPageSchema([{ question: 'Q', answer: '</script><b>x</b>' }]))
    expect(html).not.toContain('<')
    expect(JSON.parse(html).mainEntity[0].acceptedAnswer.text).toBe('</script><b>x</b>')
  })
})
