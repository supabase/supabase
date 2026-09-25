import { describe, expect, it } from 'vitest'

import { buildBlogPostsParams } from './blog-params'

describe('buildBlogPostsParams', () => {
  it('includes offset and limit', () => {
    expect(buildBlogPostsParams({ offset: 25, limit: 25 }).toString()).toBe('offset=25&limit=25')
  })

  it('includes the category when one is selected', () => {
    expect(buildBlogPostsParams({ offset: 25, limit: 25, category: 'postgres' }).toString()).toBe(
      'offset=25&limit=25&category=postgres'
    )
  })

  it('includes the search term when one is entered', () => {
    expect(buildBlogPostsParams({ offset: 25, limit: 25, search: 'postgres' }).toString()).toBe(
      'offset=25&limit=25&q=postgres'
    )
  })

  it('includes both category and search', () => {
    expect(
      buildBlogPostsParams({
        offset: 50,
        limit: 25,
        category: 'postgres',
        search: 'launch-week',
      }).toString()
    ).toBe('offset=50&limit=25&category=postgres&q=launch-week')
  })

  it('drops the category when it is "all"', () => {
    expect(buildBlogPostsParams({ offset: 25, limit: 25, category: 'all' }).toString()).toBe(
      'offset=25&limit=25'
    )
  })

  it('omits empty filters', () => {
    expect(
      buildBlogPostsParams({ offset: 25, limit: 25, category: undefined, search: '' }).toString()
    ).toBe('offset=25&limit=25')
  })
})
