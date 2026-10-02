export type BlogView = 'list' | 'grid'

export const BLOG_VIEW_COOKIE = 'blog-view'

export function isBlogView(value: string | undefined | null): value is BlogView {
  return value === 'list' || value === 'grid'
}

/**
 * Persist the list/grid preference in a cookie so the server can render the
 * correct view on the next load. Storing it client-side (localStorage) caused a
 * hydration flicker: the server rendered the default `list`, then the client
 * swapped to `grid`. Client-side only — call from an event handler.
 */
export function setBlogViewCookie(view: BlogView) {
  document.cookie = `${BLOG_VIEW_COOKIE}=${view}; path=/; max-age=31536000; samesite=lax`
}
