/**
 * Build the query params for a blog-posts request.
 *
 * Shared by the initial filter request and the paginated "load more"
 * requests so both carry the same filters.
 */
export function buildBlogPostsParams({
  offset,
  limit,
  category,
  search,
}: {
  offset: number
  limit: number
  category?: string
  search?: string
}): URLSearchParams {
  const params = new URLSearchParams({
    offset: offset.toString(),
    limit: limit.toString(),
  })

  if (category && category !== 'all') {
    params.set('category', category)
  }
  if (search) {
    params.set('q', search)
  }

  return params
}
