import { validateReturnTo } from './gotrue'

describe('validateReturnTo', () => {
  const fallback = '/projects'

  it('should return the path if it is a valid internal path', () => {
    expect(validateReturnTo('/dashboard')).toBe('/dashboard')
    expect(validateReturnTo('/settings/profile')).toBe('/settings/profile')
    expect(validateReturnTo('/projects?id=123')).toBe('/projects?id=123')
  })

  it('should return fallback if given an external URL', () => {
    expect(validateReturnTo('https://example.com')).toBe(fallback)
    expect(validateReturnTo('http://malicious-site.com')).toBe(fallback)
    expect(validateReturnTo('//evil.com')).toBe(fallback)
  })

  it('should return fallback for potentially malicious paths', () => {
    expect(validateReturnTo('/%2e%2e/etc/passwd')).toBe(fallback)
    expect(validateReturnTo('/..')).toBe(fallback)
    expect(validateReturnTo('/@evil/path')).toBe(fallback)
    expect(validateReturnTo('/$malicious')).toBe(fallback)
  })

  it('should use custom fallback when provided', () => {
    const customFallback = '/custom-fallback'
    expect(validateReturnTo('https://example.com', customFallback)).toBe(customFallback)
    expect(validateReturnTo('/%2e%2e/etc/passwd', customFallback)).toBe(customFallback)
  })

  it('should handle paths with query parameters correctly', () => {
    expect(validateReturnTo('/dashboard?param1=value1&param2=value2')).toBe(
      '/dashboard?param1=value1&param2=value2'
    )
  })
})
