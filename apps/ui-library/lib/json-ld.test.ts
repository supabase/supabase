import { describe, expect, it } from 'vitest'

import { breadcrumbListSchema, serializeJsonLd, techArticleSchema } from './json-ld'

describe('serializeJsonLd', () => {
  it('escapes characters that could break out of the script tag', () => {
    const out = serializeJsonLd({ name: '</script><b>&' })
    expect(out).not.toContain('<')
    expect(out).not.toContain('>')
    expect(out).not.toContain('&')
    expect(JSON.parse(out)).toEqual({ name: '</script><b>&' })
  })
})

describe('techArticleSchema', () => {
  it('ties the article to its canonical URL', () => {
    const schema = techArticleSchema({
      url: 'https://supabase.com/library/docs/nextjs/dropzone',
      headline: 'Dropzone (File Upload)',
      description: 'Drag-and-drop uploads.',
    })
    expect(schema).toMatchObject({
      '@type': 'TechArticle',
      '@id': 'https://supabase.com/library/docs/nextjs/dropzone#page',
      url: 'https://supabase.com/library/docs/nextjs/dropzone',
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': 'https://supabase.com/library/docs/nextjs/dropzone',
      },
      headline: 'Dropzone (File Upload)',
      description: 'Drag-and-drop uploads.',
    })
  })

  it('omits the description when none is given', () => {
    const schema = techArticleSchema({ url: 'https://supabase.com/library/docs/x', headline: 'X' })
    expect(schema.description).toBeUndefined()
  })
})

describe('breadcrumbListSchema', () => {
  it('numbers items from the root down', () => {
    const schema = breadcrumbListSchema([
      { name: 'Supabase Library', url: 'https://supabase.com/library' },
      { name: 'Dropzone', url: 'https://supabase.com/library/docs/nextjs/dropzone' },
    ])
    expect(schema.itemListElement).toEqual([
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Supabase Library',
        item: 'https://supabase.com/library',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Dropzone',
        item: 'https://supabase.com/library/docs/nextjs/dropzone',
      },
    ])
  })
})
