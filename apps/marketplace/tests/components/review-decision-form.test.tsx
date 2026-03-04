import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const saveItemReviewActionMock = vi.fn()

vi.mock('@/app/protected/actions', () => ({
  saveItemReviewAction: (...args: unknown[]) => saveItemReviewActionMock(...args),
}))

import { ReviewDecisionForm } from '@/app/protected/[partnerslug]/reviews/[itemId]/review-decision-form'

describe('ReviewDecisionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    saveItemReviewActionMock.mockResolvedValue({ itemId: 1, partnerSlug: 'acme' })
  })

  it('submits review form data and shows success state', async () => {
    const user = userEvent.setup()
    render(
      <ReviewDecisionForm
        title="Auth Starter"
        partnerTitle="Acme"
        partnerSlug="acme"
        itemId={1}
        defaultValues={{ status: 'pending_review', featured: false, reviewNotes: '' }}
      />
    )

    await user.type(screen.getByPlaceholderText('Write reviewer notes for the submitter.'), 'LGTM')
    await user.click(screen.getByRole('button', { name: 'Send review' }))

    await waitFor(() => {
      expect(saveItemReviewActionMock).toHaveBeenCalledTimes(1)
    })
    expect(await screen.findByText('Review decision saved.')).toBeInTheDocument()
  })
})
