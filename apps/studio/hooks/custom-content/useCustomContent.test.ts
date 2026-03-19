import { renderHook, cleanup } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
  cleanup()
})

describe('useCustomContent', () => {
  it('should return null if content is not found in the custom-content.json file', async () => {
    vi.doMock('./custom-content.json', () => ({
      default: {
        'organization:legal_documents': null,
      },
    }))

    const { useCustomContent } = await import('./useCustomContent')
    const { result } = renderHook(() => useCustomContent(['organization:legal_documents']))
    expect(result.current.organizationLegalDocuments).toEqual(null)
  })

  it('should return the content for the key passed in if it exists in the custom-content.json file', async () => {
    vi.doMock('./custom-content.json', () => ({
      default: {
        'organization:legal_documents': {
          someValue: 'foo',
        },
      },
    }))

    const { useCustomContent } = await import('./useCustomContent')
    const { result } = renderHook(() => useCustomContent(['organization:legal_documents']))
    expect(result.current.organizationLegalDocuments).toEqual({ someValue: 'foo' })
  })
})
