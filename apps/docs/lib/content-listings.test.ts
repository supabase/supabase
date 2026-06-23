import { storageGetStarted } from '~/components/listings/storage.data'
import { ListingsMarkdownHandlers } from '~/internals/markdown-schema/Listings'
import {
  serializeContentListingGroupToMarkdown,
  serializeContentListingsToMarkdown,
} from '~/lib/content-listings.markdown'
import {
  getContentListingGridItemClassName,
  getContentListingHeadingTag,
  normalizeContentListingHref,
  parseContentListings,
} from '~/lib/content-listings.schema'
import { describe, expect, it } from 'vitest'

describe('parseContentListings', () => {
  it('accepts valid grouped items', () => {
    const result = parseContentListings([
      {
        id: 'get-started',
        heading: 'Get started',
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
    expect(result?.[0].id).toBe('get-started')
  })

  it('accepts groups with id only and no heading', () => {
    const result = parseContentListings([
      {
        id: 'get-started',
        items: [
          {
            title: 'Connect',
            href: '/guides/database/connecting-to-postgres',
            description: 'Connection strings and pooler modes.',
          },
        ],
      },
    ])

    expect(result?.[0].heading).toBeUndefined()
  })

  it('accepts groups without id when heading is set', () => {
    const result = parseContentListings([
      {
        heading: 'Get started',
        items: [
          {
            title: 'Connect',
            href: '/guides/database/connecting-to-postgres',
            description: 'Connection strings and pooler modes.',
          },
        ],
      },
    ])

    expect(result?.[0].id).toBeUndefined()
    expect(result?.[0].heading).toBe('Get started')
  })

  it('normalizes heading-level from kebab-case YAML', () => {
    const result = parseContentListings([
      {
        id: 'get-started',
        heading: 'Get started',
        'heading-level': '###',
        items: [
          {
            title: 'Connect',
            href: '/guides/database/connecting-to-postgres',
            description: 'Connection strings and pooler modes.',
          },
        ],
      },
    ])

    expect(result?.[0].headingLevel).toBe('###')
  })

  it('accepts optional icon on items', () => {
    const result = parseContentListings([
      {
        id: 'examples',
        type: 'grid',
        items: [
          {
            title: 'Resumable Uploads with Uppy',
            href: 'https://github.com/supabase/supabase/tree/master/examples/storage/resumable-upload-uppy',
            description: 'Use Uppy to upload files with the TUS protocol.',
            icon: '/docs/img/icons/github-icon',
          },
        ],
      },
    ])

    expect(result?.[0].items[0].icon).toBe('/docs/img/icons/github-icon')
  })

  it('accepts external hrefs', () => {
    const result = parseContentListings([
      {
        id: 'examples',
        items: [
          {
            title: 'GitHub',
            href: 'https://github.com/supabase/supabase',
            description: 'External link.',
          },
        ],
      },
    ])

    expect(result?.[0].items[0].href).toBe('https://github.com/supabase/supabase')
  })

  it('rejects invalid hrefs', () => {
    expect(() =>
      parseContentListings([
        {
          id: 'get-started',
          items: [
            {
              title: 'Bad link',
              href: 'ftp://example.com',
              description: 'Invalid protocol.',
            },
          ],
        },
      ])
    ).toThrow(/Invalid contentListings href/)
  })

  it('accepts grid columns when type is grid', () => {
    const result = parseContentListings([
      {
        id: 'get-started',
        type: 'grid',
        columns: 3,
        items: [
          {
            title: 'Quickstart',
            href: '/guides/storage/quickstart',
            description: 'Store and serve files.',
          },
        ],
      },
    ])

    expect(result?.[0].columns).toBe(3)
  })

  it('leaves columns undefined when type is grid and columns is omitted', () => {
    const result = parseContentListings([
      {
        id: 'get-started',
        type: 'grid',
        items: [
          {
            title: 'Quickstart',
            href: '/guides/storage/quickstart',
            description: 'Store and serve files.',
          },
        ],
      },
    ])

    expect(result?.[0].columns).toBeUndefined()
  })

  it('rejects columns when type is not grid', () => {
    expect(() =>
      parseContentListings([
        {
          id: 'get-started',
          type: 'list',
          columns: 3,
          items: [
            {
              title: 'Quickstart',
              href: '/guides/storage/quickstart',
              description: 'Store and serve files.',
            },
          ],
        },
      ])
    ).toThrow(/columns is only valid when type is grid/)
  })

  it('requires item descriptions', () => {
    expect(() =>
      parseContentListings([
        {
          id: 'get-started',
          items: [{ title: 'Connect', href: '/guides/database/connecting-to-postgres' }],
        },
      ])
    ).toThrow(/Invalid content listing/)
  })
})

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

describe('getContentListingHeadingTag', () => {
  it('maps markdown heading levels to html tags', () => {
    expect(getContentListingHeadingTag('##')).toBe('h2')
    expect(getContentListingHeadingTag('###')).toBe('h3')
    expect(getContentListingHeadingTag('####')).toBe('h4')
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
        headingLevel: '###',
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

describe('ListingsMarkdownHandlers', () => {
  it('exports markdown for named listing components from shared data', () => {
    const markdown = ListingsMarkdownHandlers.StorageGetStartedListings()

    expect(markdown).toContain('## Get started')
    expect(markdown).toContain('Files buckets')
    expect(markdown).toContain('/guides/storage/quickstart')
  })

  it('matches serializeContentListingGroupToMarkdown for the same data', () => {
    expect(ListingsMarkdownHandlers.StorageGetStartedListings()).toBe(
      serializeContentListingGroupToMarkdown(storageGetStarted, '')
    )
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
