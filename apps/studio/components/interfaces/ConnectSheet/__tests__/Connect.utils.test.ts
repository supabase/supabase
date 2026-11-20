import { describe, expect, test } from 'vitest'

import { resolveFrameworkLibraryKey } from '../Connect.utils'

describe('Connect.utils:resolveFrameworkLibraryKey', () => {
  test.each<[string, string | undefined, string | undefined, string | undefined, string | null]>([
    ['no framework', undefined, undefined, undefined, null],
    ['empty framework string', '', undefined, undefined, null],
    ['unknown framework', 'unknown-framework', undefined, undefined, null],
    ['explicit library', 'nextjs', 'app', 'custom-library', 'custom-library'],
    ['Next.js App Router', 'nextjs', 'app', undefined, 'supabasejs'],
    ['Next.js Pages Router', 'nextjs', 'pages', undefined, 'supabasejs'],
    ['React with Vite', 'react', 'vite', undefined, 'supabasejs'],
    // Falls back to the first variant's library when no variant is specified
    ['multi-variant framework without variant', 'nextjs', undefined, undefined, 'supabasejs'],
    // Single child framework: the child itself is the library
    ['framework without variants (Remix)', 'remix', undefined, undefined, 'supabasejs'],
    ['Flutter', 'flutter', undefined, undefined, 'supabaseflutter'],
    ['Swift', 'swift', undefined, undefined, 'supabaseswift'],
    ['Android Kotlin', 'androidkotlin', undefined, undefined, 'supabasekt'],
    ['Flask (Python)', 'flask', undefined, undefined, 'supabasepy'],
  ])('%s', (_label, framework, frameworkVariant, library, expected) => {
    expect(resolveFrameworkLibraryKey({ framework, frameworkVariant, library })).toBe(expected)
  })
})
