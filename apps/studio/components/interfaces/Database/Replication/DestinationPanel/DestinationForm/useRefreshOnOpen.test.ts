import { describe, expect, it } from 'vitest'

import {
  isMetadataListErrorVisible,
  isMetadataListLoading,
  isMetadataValueLoading,
} from './useRefreshOnOpen'

describe('replication metadata loading UI', () => {
  it('shows a list skeleton only while pending or fetching an empty list', () => {
    expect(isMetadataListLoading(true, 0)).toBe(true)
    expect(isMetadataListLoading(true, 3)).toBe(false)
    expect(isMetadataListLoading(false, 0)).toBe(false)
  })

  it('shows a list error only when the request failed and the list is empty', () => {
    expect(isMetadataListErrorVisible(true, 0)).toBe(true)
    expect(isMetadataListErrorVisible(true, 3)).toBe(false)
    expect(isMetadataListErrorVisible(false, 0)).toBe(false)
  })

  it('shows a record skeleton only while fetching a missing value', () => {
    expect(isMetadataValueLoading(true, undefined)).toBe(true)
    expect(isMetadataValueLoading(true, { name: 'analytics' })).toBe(false)
    expect(isMetadataValueLoading(false, undefined)).toBe(false)
  })
})
