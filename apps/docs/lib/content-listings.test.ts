import { storageGetStarted } from '~/data/content-listings/storage.data'
import { ContentListings as ContentListingsMarkdownHandler } from '~/internals/markdown-schema/Listings'
import {
  serializeContentListingGroupToMarkdown,
  serializeContentListingsToMarkdown,
} from '~/lib/content-listings.markdown'
import {
  getContentListingGridItemClassName,
  normalizeContentListingHref,
} from '~/lib/content-listings.schema'
import { describe, expect, it } from 'vitest'

describe('getContentListingGridItemClassName', () => {
  it('defaults to 3 columns when no argument is provided', () => {
    expect(getContentListingGridItemClassName()).toBe('col-span-12 md:col-span-4')
  })

  it('maps column counts to tailwind grid spans', () => {
    expect(getContentListingGridItemClassName(2)).toBe('col-span-12 md:col-span-6')
    expect(getContentListingGridItemClassName(3)).toBe('col-span-12 md:col-span-4')
    expect(getContentListingGridItemClassName(4)).toBe('col-span-12 md:col-span-3')
  })
})

describe('serializeContentListingGroupToMarkdown', () => {
  it('renders grouped items with absolute URLs and descriptions', () => {
    const markdown = serializeContentListingGroupToMarkdown(
      {
        id: 'get-started',
        heading: 'Get started',
        description: 'Read these first.',
        items: [
          {
            title: 'Connect to your database',
            href: '/guides/database/connecting-to-postgres',
            description: 'Connection strings and pooler modes.',
          },
        ],
      },
      'https://supabase.com'
    )

    expect(markdown).toContain('## Get started')
    expect(markdown).toContain('Read these first.')
    expect(markdown).toContain(
      '**[Connect to your database](https://supabase.com/docs/guides/database/connecting-to-postgres):** Connection strings and pooler modes.'
    )
  })

  it('preserves external hrefs in markdown export', () => {
    const markdown = serializeContentListingGroupToMarkdown(
      {
        id: 'resources',
        items: [
          {
            title: 'Storage API',
            href: 'https://github.com/supabase/storage-api',
            description: 'View the source code.',
          },
        ],
      },
      'https://supabase.com'
    )

    expect(markdown).toContain(
      '**[Storage API](https://github.com/supabase/storage-api):** View the source code.'
    )
  })

  it('respects heading-level in markdown export', () => {
    const markdown = serializeContentListingGroupToMarkdown(
      {
        id: 'get-started',
        heading: 'Get started',
        headingLevel: 'h3',
        items: [
          {
            title: 'Connect',
            href: '/guides/database/connecting-to-postgres',
            description: 'Connection strings.',
          },
        ],
      },
      ''
    )

    expect(markdown).toContain('### Get started')
  })

  it('omits heading line when heading is not set', () => {
    const markdown = serializeContentListingGroupToMarkdown(
      {
        id: 'get-started',
        items: [
          {
            title: 'Connect',
            href: '/guides/database/connecting-to-postgres',
            description: 'Connection strings.',
          },
        ],
      },
      ''
    )

    expect(markdown).not.toMatch(/^#+\s/m)
    expect(markdown).toContain('**[Connect]')
  })
})

describe('serializeContentListingsToMarkdown', () => {
  it('joins multiple groups with blank lines', () => {
    const markdown = serializeContentListingsToMarkdown(
      [
        {
          id: 'get-started',
          heading: 'Get started',
          items: [
            {
              title: 'Connect',
              href: '/guides/database/connecting-to-postgres',
              description: 'Connection strings.',
            },
          ],
        },
        {
          id: 'next-steps',
          heading: 'Next steps',
          items: [
            {
              title: 'Functions',
              href: '/guides/database/functions',
              description: 'Database functions.',
            },
          ],
        },
      ],
      ''
    )

    expect(markdown).toContain('## Get started')
    expect(markdown).toContain('## Next steps')
  })
})

describe('ContentListings markdown handler', () => {
  it('serializes the group looked up by id', () => {
    const markdown = ContentListingsMarkdownHandler({ props: { id: 'storage-get-started' } })

    expect(markdown).toContain('## Get started')
    expect(markdown).toContain('Files buckets')
    expect(markdown).toContain('/guides/storage/quickstart')
  })

  it('returns empty string when id is missing or unknown', () => {
    expect(ContentListingsMarkdownHandler({ props: {} })).toBe('')
    expect(ContentListingsMarkdownHandler({ props: { id: 'nonexistent-id' } })).toBe('')
  })

  it('matches direct serializeContentListingGroupToMarkdown for the same data', () => {
    const handler = ContentListingsMarkdownHandler({ props: { id: 'storage-get-started' } })
    const direct = serializeContentListingGroupToMarkdown(storageGetStarted, '')
    expect(handler).toBe(direct)
  })
})

describe('normalizeContentListingHref', () => {
  it('strips /docs prefix from /docs/guides paths', () => {
    expect(normalizeContentListingHref('/docs/guides/auth')).toBe('/guides/auth')
  })

  it('strips /docs prefix from /docs/dashboard paths', () => {
    expect(normalizeContentListingHref('/docs/dashboard/project/_/sql')).toBe(
      '/dashboard/project/_/sql'
    )
  })

  it('leaves /dashboard paths unchanged', () => {
    expect(normalizeContentListingHref('/dashboard/project/_/sql')).toBe('/dashboard/project/_/sql')
  })

  it('leaves external URLs unchanged', () => {
    expect(normalizeContentListingHref('https://github.com/supabase/supabase')).toBe(
      'https://github.com/supabase/supabase'
    )
  })
})

describe('TelemetryEvent union', () => {
  it('includes docs_content_listing_clicked', () => {
    const event = {
      action: 'docs_content_listing_clicked' as const,
      properties: {
        targetPath: '/guides/storage',
        linkTitle: 'Storage',
      },
    }

    const _typeCheck: import('common/telemetry-constants').TelemetryEvent = event
    expect(_typeCheck.action).toBe('docs_content_listing_clicked')
  })
})
