import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/components/item-form', () => ({
  ItemForm: () => <div data-testid="item-form" />,
}))

vi.mock('ui-patterns/MarketplaceItem', () => ({
  MarketplaceItem: () => <div data-testid="marketplace-preview" />,
}))

vi.mock('@/app/protected/actions', () => ({
  requestItemReviewAction: vi.fn(),
}))

import { ItemEditorSplitView } from '@/components/item-editor-split-view'

const baseEditProps = {
  mode: 'edit' as const,
  partner: { id: 1, slug: 'acme', title: 'Acme' },
  item: {
    id: 12,
    slug: 'auth-item',
    title: 'Auth Item',
    summary: null,
    content: null,
    type: 'oauth',
    url: 'https://example.com',
    registry_item_url: null,
    documentation_url: null,
    updated_at: null,
  },
  initialFiles: [],
}

describe('ItemEditorSplitView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders approved status badge for approved review state', () => {
    render(
      <ItemEditorSplitView
        {...baseEditProps}
        reviewRequest={{
          itemId: 12,
          itemSlug: 'auth-item',
          partnerSlug: 'acme',
          isApproved: true,
          hasOpenReview: false,
          latestReviewStatus: 'approved',
          latestReviewNotes: null,
          openReviewStatusLabel: null,
        }}
      />
    )

    expect(screen.getByText('Approved')).toBeInTheDocument()
  })

  it('renders request review action when no open review exists', () => {
    render(
      <ItemEditorSplitView
        {...baseEditProps}
        reviewRequest={{
          itemId: 12,
          itemSlug: 'auth-item',
          partnerSlug: 'acme',
          isApproved: false,
          hasOpenReview: false,
          latestReviewStatus: null,
          latestReviewNotes: null,
          openReviewStatusLabel: null,
        }}
      />
    )

    expect(screen.getByRole('button', { name: 'Request review' })).toBeInTheDocument()
  })
})
