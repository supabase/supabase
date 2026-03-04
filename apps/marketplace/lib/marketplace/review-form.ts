import type { ReviewStatus } from '@/lib/marketplace/review-state'

export function buildReviewDecisionFormData({
  partnerSlug,
  itemId,
  status,
  reviewNotes,
  featured,
}: {
  partnerSlug: string
  itemId: number
  status: ReviewStatus
  reviewNotes?: string
  featured: boolean
}) {
  const formData = new FormData()
  formData.set('partnerSlug', partnerSlug)
  formData.set('itemId', String(itemId))
  formData.set('status', status)
  formData.set('reviewNotes', reviewNotes ?? '')
  if (featured) {
    formData.set('featured', 'on')
  }
  return formData
}
