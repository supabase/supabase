export const REVIEW_STATUSES = ['pending_review', 'approved', 'rejected', 'draft'] as const

export type ReviewStatus = (typeof REVIEW_STATUSES)[number]

export function isReviewStatus(value: string): value is ReviewStatus {
  return REVIEW_STATUSES.some((status) => status === value)
}

export function shouldRequestReview(existingStatus: string | null | undefined) {
  return !existingStatus || (existingStatus !== 'pending_review' && existingStatus !== 'draft')
}

export function deriveOpenReviewState(latestStatus: string | null | undefined) {
  const hasOpenReview = latestStatus === 'pending_review' || latestStatus === 'draft'
  const isApproved = latestStatus === 'approved'
  const openReviewStatusLabel =
    latestStatus === 'pending_review' ? 'Pending review' : latestStatus === 'draft' ? 'Draft' : null

  return { hasOpenReview, isApproved, openReviewStatusLabel }
}

export function deriveReviewDecisionDefaults(
  latestReview:
    | {
        status?: string | null
        featured?: boolean | null
        review_notes?: string | null
      }
    | null
    | undefined
) {
  const normalizedStatus = latestReview?.status ?? ''
  const status: ReviewStatus = isReviewStatus(normalizedStatus) ? normalizedStatus : 'pending_review'
  return {
    status,
    featured: latestReview?.featured ?? false,
    reviewNotes: latestReview?.review_notes ?? '',
  }
}
