import { describe, expect, it } from 'vitest'

import {
  deriveLatestReviewStatusDisplay,
  deriveOpenReviewState,
  deriveReviewDecisionDefaults,
  isReviewStatus,
  shouldRequestReview,
} from './review-state'

describe('review-state utils', () => {
  it('validates known review statuses', () => {
    expect(isReviewStatus('approved')).toBe(true)
    expect(isReviewStatus('pending_review')).toBe(true)
    expect(isReviewStatus('unknown')).toBe(false)
  })

  it('determines if request-review upsert is needed', () => {
    expect(shouldRequestReview(undefined)).toBe(true)
    expect(shouldRequestReview('rejected')).toBe(true)
    expect(shouldRequestReview('pending_review')).toBe(false)
    expect(shouldRequestReview('draft')).toBe(false)
  })

  it('derives open review flags and labels', () => {
    expect(deriveOpenReviewState('pending_review')).toEqual({
      hasOpenReview: true,
      isApproved: false,
      openReviewStatusLabel: 'Pending review',
    })
    expect(deriveOpenReviewState('approved')).toEqual({
      hasOpenReview: false,
      isApproved: true,
      openReviewStatusLabel: null,
    })
  })

  it('derives review status labels and badge variants', () => {
    expect(deriveLatestReviewStatusDisplay('approved')).toEqual({
      label: 'Approved',
      variant: 'success',
    })
    expect(deriveLatestReviewStatusDisplay('rejected')).toEqual({
      label: 'Rejected',
      variant: 'destructive',
    })
    expect(deriveLatestReviewStatusDisplay('draft')).toEqual({
      label: 'Draft',
      variant: 'warning',
    })
    expect(deriveLatestReviewStatusDisplay(null)).toBeNull()
  })

  it('derives review decision defaults with safe fallback', () => {
    expect(deriveReviewDecisionDefaults(null)).toEqual({
      status: 'pending_review',
      featured: false,
      reviewNotes: '',
    })
    expect(
      deriveReviewDecisionDefaults({
        status: 'rejected',
        featured: true,
        review_notes: 'Missing docs',
      })
    ).toEqual({
      status: 'rejected',
      featured: true,
      reviewNotes: 'Missing docs',
    })
  })
})
