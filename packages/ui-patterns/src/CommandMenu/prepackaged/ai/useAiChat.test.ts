import { describe, expect, it } from 'vitest'

import { parseSourcesFromContent } from './useAiChat'

describe('parseSourcesFromContent', () => {
  it('should parse content without sources section', () => {
    const content = 'This is a simple response without any sources.'
    const result = parseSourcesFromContent(content)

    expect(result.cleanedContent).toBe(content)
    expect(result.sources).toEqual([])
  })

  it('should parse content with sources section at the end', () => {
    const content = `Here is the answer to your question.

This provides more information.

### Sources
- /guides/auth
- /guides/database
- /reference/api`

    const result = parseSourcesFromContent(content)

    expect(result.cleanedContent).toBe(`Here is the answer to your question.

This provides more information.`)
    expect(result.sources).toEqual([
      { path: '/guides/auth', url: 'https://supabase.com/docs/guides/auth' },
      { path: '/guides/database', url: 'https://supabase.com/docs/guides/database' },
      { path: '/reference/api', url: 'https://supabase.com/docs/reference/api' },
    ])
  })

  it('should parse content with sources section with extra newlines', () => {
    const content = `Here is the answer to your question.

This provides more information.

### Sources


- /guides/auth
- /guides/database
- /reference/api`

    const result = parseSourcesFromContent(content)

    expect(result.cleanedContent).toBe(`Here is the answer to your question.

This provides more information.`)
    expect(result.sources).toEqual([
      { path: '/guides/auth', url: 'https://supabase.com/docs/guides/auth' },
      { path: '/guides/database', url: 'https://supabase.com/docs/guides/database' },
      { path: '/reference/api', url: 'https://supabase.com/docs/reference/api' },
    ])
  })

  it('should handle sources section with extra whitespace', () => {
    const content = `Content here.

### Sources  
- /guides/auth
- /guides/database`

    const result = parseSourcesFromContent(content)

    expect(result.cleanedContent).toBe('Content here.')
    expect(result.sources).toEqual([
      { path: '/guides/auth', url: 'https://supabase.com/docs/guides/auth' },
      { path: '/guides/database', url: 'https://supabase.com/docs/guides/database' },
    ])
  })

  it('should filter out invalid paths that do not start with slash', () => {
    const content = `Answer here.

### Sources
- /guides/auth
- docs/invalid-path
- https://external-site.com/page
- /valid/path`

    const result = parseSourcesFromContent(content)

    expect(result.cleanedContent).toBe('Answer here.')
    expect(result.sources).toEqual([
      { path: '/guides/auth', url: 'https://supabase.com/docs/guides/auth' },
      { path: '/valid/path', url: 'https://supabase.com/docs/valid/path' },
    ])
  })

  it('should handle empty sources section', () => {
    const content = `Answer here.

### Sources
`

    const result = parseSourcesFromContent(content)

    expect(result.cleanedContent).toBe('Answer here.')
    expect(result.sources).toEqual([])
  })

  it('should handle sources section with only whitespace', () => {
    const content = `Answer here.

### Sources
   
`

    const result = parseSourcesFromContent(content)

    expect(result.cleanedContent).toBe('Answer here.')
    expect(result.sources).toEqual([])
  })

  it('should not match sources section that is not at the very end', () => {
    const content = `Here is some content.

### Sources
- /guides/auth

More content continues here after sources.`

    const result = parseSourcesFromContent(content)

    expect(result.cleanedContent).toBe(content)
    expect(result.sources).toEqual([])
  })

  it('should match sources section with newline after header', () => {
    const content = `Answer here.

### Sources`

    const result = parseSourcesFromContent(content)

    expect(result.cleanedContent).toBe('Answer here.')
    expect(result.sources).toEqual([])
  })

  it('should handle multiple sources sections (only process the last one at the end)', () => {
    const content = `Content here.

### Sources
- /guides/first

More content.

### Sources
- /guides/auth
- /guides/database`

    const result = parseSourcesFromContent(content)

    expect(result.cleanedContent).toBe(`Content here.

### Sources
- /guides/first

More content.`)
    expect(result.sources).toEqual([
      { path: '/guides/auth', url: 'https://supabase.com/docs/guides/auth' },
      { path: '/guides/database', url: 'https://supabase.com/docs/guides/database' },
    ])
  })

  it('should handle sources with trailing newlines', () => {
    const content = `Answer here.

### Sources
- /guides/auth
- /guides/database

`

    const result = parseSourcesFromContent(content)

    expect(result.cleanedContent).toBe('Answer here.')
    expect(result.sources).toEqual([
      { path: '/guides/auth', url: 'https://supabase.com/docs/guides/auth' },
      { path: '/guides/database', url: 'https://supabase.com/docs/guides/database' },
    ])
  })

  it('should handle content with only a sources section', () => {
    const content = `### Sources
- /guides/auth
- /guides/database`

    const result = parseSourcesFromContent(content)

    expect(result.cleanedContent).toBe('')
    expect(result.sources).toEqual([
      { path: '/guides/auth', url: 'https://supabase.com/docs/guides/auth' },
      { path: '/guides/database', url: 'https://supabase.com/docs/guides/database' },
    ])
  })
})
