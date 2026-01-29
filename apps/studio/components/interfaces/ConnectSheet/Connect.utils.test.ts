import { describe, test, expect } from 'vitest'
import { resolveFrameworkLibraryKey } from './Connect.utils'

describe('Connect.utils:resolveFrameworkLibraryKey', () => {
  test('should return null if no framework provided', () => {
    const result = resolveFrameworkLibraryKey({
      framework: undefined,
      frameworkVariant: undefined,
      library: undefined,
    })
    expect(result).toBeNull()
  })

  test('should return null for empty framework string', () => {
    const result = resolveFrameworkLibraryKey({
      framework: '',
      frameworkVariant: undefined,
      library: undefined,
    })
    expect(result).toBeNull()
  })

  test('should return explicit library if provided', () => {
    const result = resolveFrameworkLibraryKey({
      framework: 'nextjs',
      frameworkVariant: 'app',
      library: 'custom-library',
    })
    expect(result).toBe('custom-library')
  })

  test('should resolve library for Next.js App Router', () => {
    const result = resolveFrameworkLibraryKey({
      framework: 'nextjs',
      frameworkVariant: 'app',
      library: undefined,
    })
    // Next.js App Router has supabasejs as its library
    expect(result).toBe('supabasejs')
  })

  test('should resolve library for Next.js Pages Router', () => {
    const result = resolveFrameworkLibraryKey({
      framework: 'nextjs',
      frameworkVariant: 'pages',
      library: undefined,
    })
    expect(result).toBe('supabasejs')
  })

  test('should resolve library for React with Vite variant', () => {
    const result = resolveFrameworkLibraryKey({
      framework: 'react',
      frameworkVariant: 'vite',
      library: undefined,
    })
    expect(result).toBe('supabasejs')
  })

  test('should resolve library for React with Create React App variant', () => {
    const result = resolveFrameworkLibraryKey({
      framework: 'react',
      frameworkVariant: 'create-react-app',
      library: undefined,
    })
    expect(result).toBe('supabasejs')
  })

  test('should resolve library for framework without variants (Remix)', () => {
    const result = resolveFrameworkLibraryKey({
      framework: 'remix',
      frameworkVariant: undefined,
      library: undefined,
    })
    // Remix has single child which is supabasejs
    expect(result).toBe('supabasejs')
  })

  test('should resolve library for Flutter', () => {
    const result = resolveFrameworkLibraryKey({
      framework: 'flutter',
      frameworkVariant: undefined,
      library: undefined,
    })
    expect(result).toBe('supabaseflutter')
  })

  test('should resolve library for Swift', () => {
    const result = resolveFrameworkLibraryKey({
      framework: 'swift',
      frameworkVariant: undefined,
      library: undefined,
    })
    expect(result).toBe('supabaseswift')
  })

  test('should resolve library for Android Kotlin', () => {
    const result = resolveFrameworkLibraryKey({
      framework: 'androidkotlin',
      frameworkVariant: undefined,
      library: undefined,
    })
    expect(result).toBe('supabasekt')
  })

  test('should resolve library for Flask (Python)', () => {
    const result = resolveFrameworkLibraryKey({
      framework: 'flask',
      frameworkVariant: undefined,
      library: undefined,
    })
    expect(result).toBe('supabasepy')
  })

  test('should fallback to first variant library when variant not specified for multi-variant framework', () => {
    const result = resolveFrameworkLibraryKey({
      framework: 'nextjs',
      frameworkVariant: undefined,
      library: undefined,
    })
    // Should get library from first variant (app router)
    expect(result).toBe('supabasejs')
  })

  test('should return null for unknown framework', () => {
    const result = resolveFrameworkLibraryKey({
      framework: 'unknown-framework',
      frameworkVariant: undefined,
      library: undefined,
    })
    expect(result).toBeNull()
  })

  test('should handle SvelteKit framework', () => {
    const result = resolveFrameworkLibraryKey({
      framework: 'sveltekit',
      frameworkVariant: undefined,
      library: undefined,
    })
    expect(result).toBe('supabasejs')
  })

  test('should handle Nuxt framework', () => {
    const result = resolveFrameworkLibraryKey({
      framework: 'nuxt',
      frameworkVariant: undefined,
      library: undefined,
    })
    expect(result).toBe('supabasejs')
  })

  test('should handle Vue.js framework', () => {
    const result = resolveFrameworkLibraryKey({
      framework: 'vuejs',
      frameworkVariant: undefined,
      library: undefined,
    })
    expect(result).toBe('supabasejs')
  })

  test('should handle Solid.js framework', () => {
    const result = resolveFrameworkLibraryKey({
      framework: 'solidjs',
      frameworkVariant: undefined,
      library: undefined,
    })
    expect(result).toBe('supabasejs')
  })

  test('should handle Astro framework', () => {
    const result = resolveFrameworkLibraryKey({
      framework: 'astro',
      frameworkVariant: undefined,
      library: undefined,
    })
    expect(result).toBe('supabasejs')
  })

  test('should handle Expo React Native', () => {
    const result = resolveFrameworkLibraryKey({
      framework: 'exporeactnative',
      frameworkVariant: undefined,
      library: undefined,
    })
    expect(result).toBe('supabasejs')
  })

  test('should handle Ionic React', () => {
    const result = resolveFrameworkLibraryKey({
      framework: 'ionicreact',
      frameworkVariant: undefined,
      library: undefined,
    })
    expect(result).toBe('supabasejs')
  })

  test('should handle Ionic Angular', () => {
    const result = resolveFrameworkLibraryKey({
      framework: 'ionicangular',
      frameworkVariant: undefined,
      library: undefined,
    })
    expect(result).toBe('supabasejs')
  })

  test('should handle Refine framework', () => {
    const result = resolveFrameworkLibraryKey({
      framework: 'refine',
      frameworkVariant: undefined,
      library: undefined,
    })
    expect(result).toBe('supabasejs')
  })

  test('should handle TanStack Start framework', () => {
    const result = resolveFrameworkLibraryKey({
      framework: 'tanstack',
      frameworkVariant: undefined,
      library: undefined,
    })
    expect(result).toBe('supabasejs')
  })
})
