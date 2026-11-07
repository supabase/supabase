import { describe, expect, it } from 'vitest'

import { getMcpClientIconSrc } from './getMcpIconSrc'

describe('getMcpClientIconSrc', () => {
  it('returns the default icon when only one asset variant exists', () => {
    const lightSrc = getMcpClientIconSrc({
      icon: 'claude',
      useDarkVariant: false,
    })
    const darkSrc = getMcpClientIconSrc({
      icon: 'claude',
      useDarkVariant: true,
    })

    expect(lightSrc).toBeTruthy()
    expect(darkSrc).toBe(lightSrc)
  })

  it('returns the dark icon when a distinct dark variant exists', () => {
    const lightSrc = getMcpClientIconSrc({
      icon: 'cursor',
      useDarkVariant: false,
      hasDarkIcon: true,
    })
    const darkSrc = getMcpClientIconSrc({
      icon: 'cursor',
      useDarkVariant: true,
      hasDarkIcon: true,
    })

    expect(darkSrc).toBeTruthy()
    expect(darkSrc).not.toBe(lightSrc)
  })

  it('returns the dark icon for Perplexity when requested as a distinct variant', () => {
    const lightSrc = getMcpClientIconSrc({
      icon: 'perplexity',
      useDarkVariant: false,
      hasDarkIcon: true,
    })
    const darkSrc = getMcpClientIconSrc({
      icon: 'perplexity',
      useDarkVariant: true,
      hasDarkIcon: true,
    })

    expect(darkSrc).toBeTruthy()
    expect(darkSrc).not.toBe(lightSrc)
  })

  it('returns the dark icon for fx when requested as a distinct variant', () => {
    const lightSrc = getMcpClientIconSrc({
      icon: 'fx',
      useDarkVariant: false,
      hasDistinctDarkIcon: true,
    })
    const darkSrc = getMcpClientIconSrc({
      icon: 'fx',
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
      hasDarkIcon: true,
    })
    const src = getMcpClientIconSrc({
      icon: 'factory',
      useDarkVariant: true,
      hasDarkIcon: false,
    })

    expect(src).toBe(lightSrc)
  })

  it('returns an empty string for unknown icons', () => {
    const darkSrc = getMcpClientIconSrc({
      icon: 'unknown-client',
      useDarkVariant: true,
      hasDarkIcon: true,
    })

    expect(darkSrc).toBe('')
  })
})
