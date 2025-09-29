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
        'navigation:logo_url': null,
      },
    }))

    const { useCustomContent } = await import('./useCustomContent')
    const { result } = renderHook(() => useCustomContent(['navigation:logo_url']))
    expect(result.current.navigationLogoUrl).toEqual(null)
  })

  it('should return the content for the key passed in if it exists in the custom-content.json file', async () => {
    vi.doMock('./custom-content.json', () => ({
      default: {
        'navigation:logo_url': {
          light: 'https://example.com/logo-light.svg',
          dark: 'https://example.com/logo-dark.svg',
        },
        'homepage:heading': 'Custom Heading',
      },
    }))

    const { useCustomContent } = await import('./useCustomContent')
    const { result } = renderHook(() =>
      useCustomContent(['navigation:logo_url', 'homepage:heading'])
    )
    expect(result.current.navigationLogoUrl).toEqual({
      light: 'https://example.com/logo-light.svg',
      dark: 'https://example.com/logo-dark.svg',
    })
    expect(result.current.homepageHeading).toEqual('Custom Heading')
  })
})
