import type { AnyRouter, UseNavigateResult } from '@tanstack/react-router'

import { BASE_PATH } from './constants'
import { isAbsoluteUrl, splitInternalUrl } from './internal-url'

const MIDDLE_MOUSE_BUTTON = 1

/** `url` must be an app-relative absolute path (`/project/...`, optionally with ?query/#hash) or an external URL; bare `?query`/`#hash` targets aren't resolved against the current path. */
export const navigateToUrl = (
  navigate: UseNavigateResult<string>,
  url: string,
  { replace }: { replace?: boolean } = {}
) => {
  const { to, search, hash } = splitInternalUrl(url)
  if (isAbsoluteUrl(to)) {
    const href = to.startsWith('//') ? new URL(to, window.location.href).href : to
    return navigate({ href, reloadDocument: true, replace })
  }
  return navigate<AnyRouter, string>({ to, search: search ?? {}, hash: hash ?? '', replace })
}

/**
 * Creates a navigation handler that supports keyboard, modifier clicks, and middle mouse button.
 *
 * This is a curried function that takes a URL and navigate function, and returns an event handler that:
 * - Handles keyboard navigation (Enter/Space keys)
 * - Opens in new tab on Cmd/Ctrl + click
 * - Opens in new tab on middle mouse button click
 * - Performs normal navigation on regular click
 *
 * @param url - The relative URL to navigate to (e.g., "/project/123/functions/my-function")
 * @param navigate - TanStack Router navigate function
 * @returns Event handler function for onClick, onAuxClick, and onKeyDown
 *
 * @example
 * ```tsx
 * const navigate = useNavigate()
 * const handleNavigation = createNavigationHandler(`/project/${ref}/functions/${slug}`, navigate)
 *
 * <TableRow
 *   onClick={handleNavigation}
 *   onAuxClick={handleNavigation}
 *   onKeyDown={handleNavigation}
 *   tabIndex={0}
 * />
 * ```
 */
export const createNavigationHandler = (url: string, navigate: UseNavigateResult<string>) => {
  return (event: React.MouseEvent | React.KeyboardEvent) => {
    // Handle keyboard events
    if ('key' in event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()

        const isModifierKey = event.metaKey || event.ctrlKey
        if (isModifierKey) {
          window.open(`${BASE_PATH}${url}`, '_blank')
        } else {
          void navigateToUrl(navigate, url)
        }
      }
      return
    }

    // Handle Cmd/Ctrl + left click (modifier click)
    const isModifierClick =
      'button' in event && event.button === 0 && (event.metaKey || event.ctrlKey)
    if (isModifierClick) {
      event.preventDefault()
      window.open(`${BASE_PATH}${url}`, '_blank')
      return
    }

    // Handle middle mouse button click
    const isMiddleClick = 'button' in event && event.button === MIDDLE_MOUSE_BUTTON
    if (isMiddleClick) {
      event.preventDefault()
      window.open(`${BASE_PATH}${url}`, '_blank')
      return
    }

    // Regular left click only. Other aux buttons (e.g. right-click) must not navigate.
    if ('button' in event && event.button !== 0) return

    void navigateToUrl(navigate, url)
  }
}
