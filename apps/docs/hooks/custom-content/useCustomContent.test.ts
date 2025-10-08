/*
 * @vitest-environment jsdom
 */

import { cleanup, renderHook } from '@testing-library/react'
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
        'navigation:logo': null,
      },
    }))

    const { useCustomContent } = await import('./useCustomContent')
    const { result } = renderHook(() => useCustomContent(['navigation:logo']))
    expect(result.current.navigationLogo).toEqual(null)
  })

  it('should return the content for the key passed in if it exists in the custom-content.json file', async () => {
    vi.doMock('./custom-content.json', () => ({
      default: {
        'navigation:logo': {
          light: 'https://example.com/logo-light.svg',
          dark: 'https://example.com/logo-dark.svg',
        },
        'homepage:heading': 'Custom Heading',
      },
    }))

    const { useCustomContent } = await import('./useCustomContent')
    const { result } = renderHook(() => useCustomContent(['navigation:logo', 'homepage:heading']))
    expect(result.current.navigationLogo).toEqual({
      light: 'https://example.com/logo-light.svg',
      dark: 'https://example.com/logo-dark.svg',
    })
    expect(result.current.homepageHeading).toEqual('Custom Heading')
  })
})
