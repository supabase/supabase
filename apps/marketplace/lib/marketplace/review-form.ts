import type { ReviewStatus } from '@/lib/marketplace/review-state'

export function buildReviewDecisionFormData({
  partnerSlug,
  itemId,
  status,
  reviewNotes,
  featured,
  categoryIds,
}: {
  partnerSlug: string
  itemId: number
  status: ReviewStatus
  reviewNotes?: string
  featured: boolean
  categoryIds: number[]
}) {
  const formData = new FormData()
  formData.set('partnerSlug', partnerSlug)
  formData.set('itemId', String(itemId))
  formData.set('status', status)
  formData.set('reviewNotes', reviewNotes ?? '')
  for (const categoryId of categoryIds) {
    formData.append('categoryIds[]', String(categoryId))
  }
  if (featured) {
    formData.set('featured', 'on')
  }
  return formData
}
