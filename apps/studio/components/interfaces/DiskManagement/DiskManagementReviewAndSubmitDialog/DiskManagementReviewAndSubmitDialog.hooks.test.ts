import { describe, expect, test } from 'vitest'

import { shouldShowComputeBillingBadge } from './DiskManagementReviewAndSubmitDialog.hooks'

describe('shouldShowComputeBillingBadge', () => {
  test('shows for a dirty, valid compute price change', () => {
    expect(
      shouldShowComputeBillingBadge({
        isDirty: true,
        hasComputeSizeError: false,
        oldPrice: '10.00',
        newPrice: '20.00',
      })
    ).toBe(true)
  })

  test('hides when the selected compute size has the same price', () => {
    expect(
      shouldShowComputeBillingBadge({
        isDirty: true,
        hasComputeSizeError: false,
        oldPrice: '10.00',
        newPrice: '10',
      })
    ).toBe(false)
  })

  test('hides when the form is not dirty', () => {
    expect(
      shouldShowComputeBillingBadge({
        isDirty: false,
        hasComputeSizeError: false,
        oldPrice: '10.00',
        newPrice: '20.00',
      })
    ).toBe(false)
  })

  test('hides when compute size validation fails', () => {
    expect(
      shouldShowComputeBillingBadge({
        isDirty: true,
        hasComputeSizeError: true,
        oldPrice: '10.00',
        newPrice: '20.00',
      })
    ).toBe(false)
  })
})
