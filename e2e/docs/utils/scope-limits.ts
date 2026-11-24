// Links are cheap: one page load plus a few fetches per page.
export const MAX_LINK_PAGES = 100

// The a11y scan renders and settles each page, so it costs more per page than a link check.
export const MAX_A11Y_PAGES = 20

export function splitAtLimit<T>(items: T[], limit: number): { kept: T[]; dropped: T[] } {
  return { kept: items.slice(0, limit), dropped: items.slice(limit) }
}
