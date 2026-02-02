import type { NextRouter } from 'next/router'
import { BASE_PATH } from './constants'
import { useRouter } from 'next/navigation'

type Router = NextRouter | ReturnType<typeof useRouter>

const MIDDLE_MOUSE_BUTTON = 1

/**
 * Creates a navigation handler that supports keyboard, modifier clicks, and middle mouse button.
 *
 * This is a curried function that takes a URL and router, and returns an event handler that:
 * - Handles keyboard navigation (Enter/Space keys)
 * - Opens in new tab on Cmd/Ctrl + click
 * - Opens in new tab on middle mouse button click
 * - Performs normal navigation on regular click
 *
 * @param url - The relative URL to navigate to (e.g., "/project/123/functions/my-function")
 * @param router - Next.js router instance (supports both Pages Router and App Router)
 * @returns Event handler function for onClick, onAuxClick, and onKeyDown
 *
 * @example
 * ```tsx
 * const router = useRouter()
 * const handleNavigation = createNavigationHandler(`/project/${ref}/functions/${slug}`, router)
 *
 * <TableRow
 *   onClick={handleNavigation}
 *   onAuxClick={handleNavigation}
 *   onKeyDown={handleNavigation}
 *   tabIndex={0}
 * />
 * ```
 */
export const createNavigationHandler = (url: string, router: Router) => {
  return (event: React.MouseEvent | React.KeyboardEvent) => {
    // Handle keyboard events
    if ('key' in event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()

        const isModifierKey = event.metaKey || event.ctrlKey
        if (isModifierKey) {
          window.open(`${BASE_PATH}${url}`, '_blank')
        } else {
          router.push(url)
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

    // Handle regular left click
    router.push(url)
  }
}
