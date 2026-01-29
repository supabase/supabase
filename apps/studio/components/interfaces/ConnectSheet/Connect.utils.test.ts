import { describe, test, expect } from 'vitest'
import { resolveFrameworkLibraryKey } from './Connect.utils'

describe('Connect.utils:resolveFrameworkLibraryKey', () => {
  test('should return null when framework is not provided', () => {
    const result = resolveFrameworkLibraryKey({
      framework: undefined,
      frameworkVariant: undefined,
      library: undefined,
    })
    expect(result).toBeNull()
  })

  test('should return null when framework is empty string', () => {
    const result = resolveFrameworkLibraryKey({
      framework: '',
      frameworkVariant: undefined,
      library: undefined,
    })
    expect(result).toBeNull()
  })

  test('should return library directly if provided', () => {
    const result = resolveFrameworkLibraryKey({
      framework: 'nextjs',
      frameworkVariant: 'app',
      library: 'supabasejs',
    })
    expect(result).toBe('supabasejs')
  })

  test('should resolve library for nextjs with app variant', () => {
    const result = resolveFrameworkLibraryKey({
      framework: 'nextjs',
      frameworkVariant: 'app',
      library: undefined,
    })
    // nextjs > app > supabasejs
    expect(result).toBe('supabasejs')
  })

  test('should resolve library for nextjs with pages variant', () => {
    const result = resolveFrameworkLibraryKey({
      framework: 'nextjs',
      frameworkVariant: 'pages',
      library: undefined,
    })
    // nextjs > pages > supabasejs
    expect(result).toBe('supabasejs')
  })

  test('should resolve library for react with vite variant', () => {
    const result = resolveFrameworkLibraryKey({
      framework: 'react',
      frameworkVariant: 'vite',
      library: undefined,
    })
    // react > vite > supabasejs
    expect(result).toBe('supabasejs')
  })

  test('should resolve library for react with create-react-app variant', () => {
    const result = resolveFrameworkLibraryKey({
      framework: 'react',
      frameworkVariant: 'create-react-app',
      library: undefined,
    })
    // react > create-react-app > supabasejs
    expect(result).toBe('supabasejs')
  })

  test('should resolve library for framework without variants (nuxt)', () => {
    const result = resolveFrameworkLibraryKey({
      framework: 'nuxt',
      frameworkVariant: undefined,
      library: undefined,
    })
    // nuxt has single child: supabasejs
    expect(result).toBe('supabasejs')
  })

  test('should resolve library for framework without variants (remix)', () => {
    const result = resolveFrameworkLibraryKey({
      framework: 'remix',
      frameworkVariant: undefined,
      library: undefined,
    })
    expect(result).toBe('supabasejs')
  })

  test('should resolve library for mobile framework (flutter)', () => {
    const result = resolveFrameworkLibraryKey({
      framework: 'flutter',
      frameworkVariant: undefined,
      library: undefined,
    })
    expect(result).toBe('supabaseflutter')
  })

  test('should resolve library for mobile framework (swift)', () => {
    const result = resolveFrameworkLibraryKey({
      framework: 'swift',
      frameworkVariant: undefined,
      library: undefined,
    })
    expect(result).toBe('supabaseswift')
  })

  test('should resolve library for mobile framework (android kotlin)', () => {
    const result = resolveFrameworkLibraryKey({
      framework: 'androidkotlin',
      frameworkVariant: undefined,
      library: undefined,
    })
    expect(result).toBe('supabasekt')
  })

  test('should resolve library for expo react native', () => {
    const result = resolveFrameworkLibraryKey({
      framework: 'exporeactnative',
      frameworkVariant: undefined,
      library: undefined,
    })
    expect(result).toBe('supabasejs')
  })

  test('should resolve library for flask (python)', () => {
    const result = resolveFrameworkLibraryKey({
      framework: 'flask',
      frameworkVariant: undefined,
      library: undefined,
    })
    expect(result).toBe('supabasepy')
  })

  test('should return null for unknown framework', () => {
    const result = resolveFrameworkLibraryKey({
      framework: 'unknown-framework',
      frameworkVariant: undefined,
      library: undefined,
    })
    expect(result).toBeNull()
  })

  test('should fallback to first variant when frameworkVariant not specified for multi-variant framework', () => {
    const result = resolveFrameworkLibraryKey({
      framework: 'nextjs',
      frameworkVariant: undefined,
      library: undefined,
    })
    // Should use first variant (app) and its first library
    expect(result).toBe('supabasejs')
  })

  test('should handle invalid variant by falling back', () => {
    const result = resolveFrameworkLibraryKey({
      framework: 'nextjs',
      frameworkVariant: 'invalid-variant',
      library: undefined,
    })
    // Invalid variant should fallback to first child
    expect(result).toBe('supabasejs')
  })
})
