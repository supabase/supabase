import { storageGetStarted } from '~/data/content-listings/storage.data'
import {
  ContentListings as ContentListingsMarkdownHandler,
  serializeContentListingGroupToMarkdown,
} from '~/internals/markdown-schema/ContentListings'
import { isExternalContentListingHref } from '~/lib/content-listings.utils'
import { describe, expect, it } from 'vitest'

describe('isExternalContentListingHref', () => {
  it('treats protocol-relative URLs as external', () => {
    expect(isExternalContentListingHref('//example.com/path')).toBe(true)
  })

  it('treats absolute http(s) URLs as external', () => {
    expect(isExternalContentListingHref('https://github.com/supabase/storage-api')).toBe(true)
  })

  it('treats internal guide paths as not external', () => {
    expect(isExternalContentListingHref('/guides/storage/quickstart')).toBe(false)
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

  it('renders heading and description only once', () => {
    const markdown = serializeContentListingGroupToMarkdown(
      {
        id: 'get-started',
        heading: 'Get started',
        description: 'Read these first.',
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

    expect(markdown.match(/^## Get started$/gm)).toHaveLength(1)
    expect(markdown.match(/^Read these first\.$/gm)).toHaveLength(1)
    expect(markdown).toBe(
      '## Get started\n\nRead these first.\n\n- **[Connect](/docs/guides/database/connecting-to-postgres):** Connection strings.'
    )
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
