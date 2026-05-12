import { beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

describe('getCustomContent', () => {
  it('should return null if content is not found in the custom-content.json file', async () => {
    vi.doMock('./custom-content.json', () => ({
      default: {
        'navigation:logo': null,
      },
    }))

    const { getCustomContent } = await import('./getCustomContent')
    const result = getCustomContent(['navigation:logo'])
    expect(result.navigationLogo).toEqual(null)
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

    const { getCustomContent } = await import('./getCustomContent')
    const result = getCustomContent(['navigation:logo', 'homepage:heading'])
    expect(result.navigationLogo).toEqual({
      light: 'https://example.com/logo-light.svg',
      dark: 'https://example.com/logo-dark.svg',
    })
    expect(result.homepageHeading).toEqual('Custom Heading')
  })
})
