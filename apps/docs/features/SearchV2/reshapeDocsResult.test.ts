import { describe, expect, it } from 'vitest'

import { reshapeDocsResult } from './reshapeDocsResult'

const row = {
  slug: 'guides/database/extensions/pg_net',
  page_title: 'pg_net: Async Networking',
  heading: 'Call an endpoint every minute with pg_cron',
  heading_level: 3,
  heading_path: ['pg_net: Async Networking', 'Call an endpoint every minute with pg_cron'],
  excerpt: 'The pg_net API is available in the net schema.',
  score: 3000,
}

describe('reshapeDocsResult', () => {
  it('links a section result to the id that the docs heading renders', () => {
    expect(reshapeDocsResult(row)).toMatchObject({
      path: '/guides/database/extensions/pg_net',
      anchor: 'call-an-endpoint-every-minute-with-pgcron',
    })
  })

  it('links the page top for page titles, reference pages and headings without an id', () => {
    expect(reshapeDocsResult({ ...row, heading_level: 1 })?.anchor).toBeUndefined()
    expect(reshapeDocsResult({ ...row, heading_level: 5 })?.anchor).toBeUndefined()
  })
})
