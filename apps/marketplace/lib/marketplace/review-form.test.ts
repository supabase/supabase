import { describe, expect, it } from 'vitest'

import { buildReviewDecisionFormData } from './review-form'

describe('review-form utils', () => {
  it('builds form data payload expected by saveItemReviewAction', () => {
    const formData = buildReviewDecisionFormData({
      partnerSlug: 'acme',
      itemId: 12,
      status: 'approved',
      reviewNotes: 'Looks good',
      featured: true,
      categoryIds: [3, 8],
    })

    expect(formData.get('partnerSlug')).toBe('acme')
    expect(formData.get('itemId')).toBe('12')
    expect(formData.get('status')).toBe('approved')
    expect(formData.get('reviewNotes')).toBe('Looks good')
    expect(formData.get('featured')).toBe('on')
    expect(formData.getAll('categoryIds[]')).toEqual(['3', '8'])
  })
})
