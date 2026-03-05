import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/app/protected/actions', () => ({
  requestItemReviewAction: vi.fn(),
}))

import { ItemReviewPrimaryAction } from '@/components/item-review-primary-action'

const baseProps = {
  itemId: 12,
  itemSlug: 'auth-item',
  partnerSlug: 'acme',
  latestReviewStatus: null,
  latestReviewNotes: null,
  openReviewStatusLabel: null,
}

describe('ItemReviewPrimaryAction', () => {
  it('renders approved badge when item is approved', () => {
    render(<ItemReviewPrimaryAction {...baseProps} isApproved hasOpenReview={false} />)

    expect(screen.getByText('Approved')).toBeInTheDocument()
  })

  it('renders request review button when no review is open', () => {
    render(<ItemReviewPrimaryAction {...baseProps} isApproved={false} hasOpenReview={false} />)

    expect(screen.getByRole('button', { name: 'Request review' })).toBeInTheDocument()
  })

  it('renders open review status badge when review is in progress', () => {
    render(
      <ItemReviewPrimaryAction
        {...baseProps}
        isApproved={false}
        hasOpenReview
        openReviewStatusLabel="Pending review"
      />
    )

    expect(screen.getByText('Pending review')).toBeInTheDocument()
  })
})
