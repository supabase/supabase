import { describe, expect, it } from 'vitest'

import { getMcpClientIconSrc } from './getMcpIconSrc'

describe('getMcpClientIconSrc', () => {
  it('returns the default icon when only one asset variant exists', () => {
    const lightSrc = getMcpClientIconSrc({
      icon: 'cursor',
      useDarkVariant: false,
    })
    const darkSrc = getMcpClientIconSrc({
      icon: 'cursor',
      useDarkVariant: true,
    })

    expect(lightSrc).toBeTruthy()
    expect(darkSrc).toBe(lightSrc)
  })

  it('returns the dark icon when a distinct dark variant exists', () => {
    const lightSrc = getMcpClientIconSrc({
      icon: 'openai',
      useDarkVariant: false,
      hasDistinctDarkIcon: true,
    })
    const darkSrc = getMcpClientIconSrc({
      icon: 'openai',
      useDarkVariant: true,
      hasDistinctDarkIcon: true,
    })

    expect(darkSrc).toBeTruthy()
    expect(darkSrc).not.toBe(lightSrc)
  })

  it('falls back to the default icon when no distinct dark variant should be used', () => {
    const lightSrc = getMcpClientIconSrc({
      icon: 'factory',
      useDarkVariant: false,
      hasDistinctDarkIcon: true,
    })
    const src = getMcpClientIconSrc({
      icon: 'factory',
      useDarkVariant: true,
      hasDistinctDarkIcon: false,
    })

    expect(src).toBe(lightSrc)
  })
})
