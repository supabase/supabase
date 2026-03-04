import { describe, expect, it } from 'vitest'

import { mapReviewRows, parseReviewsFilters } from './reviews-list'

describe('reviews-list utils', () => {
  it('parses review filters with fallback behavior', () => {
    expect(parseReviewsFilters({ status: 'approved', itemId: '42' })).toMatchObject({
      statusFilter: 'approved',
      itemIdFilter: '42',
      parsedItemIdFilter: 42,
      hasValidItemIdFilter: true,
    })

    expect(parseReviewsFilters({ status: 'bad-status', itemId: 'nope' })).toMatchObject({
      statusFilter: 'pending_review',
      hasValidItemIdFilter: false,
    })
  })

  it('maps review rows and filters invalid records', () => {
    const rows = mapReviewRows(
      [
        {
          item_id: 1,
          status: 'approved',
          item: { id: 10, slug: 'auth', title: 'Auth', partner_id: 9 },
        },
        {
          item_id: 2,
          status: null,
          item: null,
        },
      ],
      new Map([[9, 'Partner A']])
    )

    expect(rows).toEqual([
      {
        reviewId: 1,
        itemId: 10,
        itemSlug: 'auth',
        itemTitle: 'Auth',
        partnerTitle: 'Partner A',
        status: 'approved',
      },
    ])
  })
})
