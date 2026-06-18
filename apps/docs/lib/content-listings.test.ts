import { buildDocsContentListingClickedEvent } from '~/components/ContentListings/content-listings.telemetry'
import { serializeContentListingsToMarkdown } from '~/lib/content-listings.markdown'
import { parseContentListings } from '~/lib/content-listings.schema'
import { describe, expect, it } from 'vitest'

describe('parseContentListings', () => {
  it('accepts valid grouped items', () => {
    const result = parseContentListings([
      {
        title: 'Get started',
        items: [
          {
            title: 'Connect',
            href: '/guides/database/connecting-to-postgres',
            description: 'Connection strings and pooler modes.',
          },
        ],
      },
    ])

    expect(result).toHaveLength(1)
  })

  it('rejects external hrefs', () => {
    expect(() =>
      parseContentListings([
        {
          title: 'Get started',
          items: [
            {
              title: 'GitHub',
              href: 'https://github.com/supabase/supabase',
              description: 'External link.',
            },
          ],
        },
      ])
    ).toThrow(/Invalid contentListings href/)
  })

  it('requires item descriptions', () => {
    expect(() =>
      parseContentListings([
        {
          title: 'Get started',
          items: [{ title: 'Connect', href: '/guides/database/connecting-to-postgres' }],
        },
      ])
    ).toThrow(/Invalid contentListings front matter/)
  })
})

describe('serializeContentListingsToMarkdown', () => {
  it('renders grouped items with absolute URLs and descriptions', () => {
    const markdown = serializeContentListingsToMarkdown(
      [
        {
          title: 'Get started',
          description: 'Read these first.',
          items: [
            {
              title: 'Connect to your database',
              href: '/guides/database/connecting-to-postgres',
              description: 'Connection strings and pooler modes.',
            },
          ],
        },
      ],
      'https://supabase.com'
    )

    expect(markdown).toContain('## Get started')
    expect(markdown).toContain('Read these first.')
    expect(markdown).toContain(
      '**[Connect to your database](https://supabase.com/docs/guides/database/connecting-to-postgres):** Connection strings and pooler modes.'
    )
  })
})

describe('buildDocsContentListingClickedEvent', () => {
  it('builds a docs_content_listing_clicked telemetry payload', () => {
    expect(
      buildDocsContentListingClickedEvent({
        item: {
          title: 'Auth',
          href: '/guides/auth',
          description: 'Supabase Auth overview.',
        },
        groupTitle: 'Get started',
        listingId: 'get-started',
      })
    ).toEqual({
      action: 'docs_content_listing_clicked',
      properties: {
        targetPath: '/guides/auth',
        linkTitle: 'Auth',
        groupTitle: 'Get started',
        listingId: 'get-started',
      },
    })
  })
})

describe('TelemetryEvent union', () => {
  it('includes docs_content_listing_clicked', () => {
    const event = buildDocsContentListingClickedEvent({
      item: {
        title: 'Storage',
        href: '/guides/storage',
        description: 'Supabase Storage overview.',
      },
    })

    const _typeCheck: import('common/telemetry-constants').TelemetryEvent = event
    expect(_typeCheck.action).toBe('docs_content_listing_clicked')
  })
})
