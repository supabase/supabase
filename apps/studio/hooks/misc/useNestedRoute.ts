import { useRouter } from 'next/router'
import { useEffect, useRef, useCallback } from 'react'

interface UseNestedRouteOptions {
  /**
   * The nested route segment to append to the current URL (e.g., 'create', 'edit/123')
   */
  nestedRoute: string
  /**
   * Whether the component is currently open/visible
   */
  isOpen: boolean
  /**
   * Callback that should open the component (e.g., setIsOpen(true))
   * This will be called when the URL already contains the nested route on initial load
   */
  onOpenTrigger: () => void
  /**
   * Callback that should close the component (e.g., setIsOpen(false))
   * This will be called when the browser back/forward button is pressed
   */
  onCloseTrigger: () => void
  /**
   * Optional callback fired when the route is restored (on close)
   */
  onRouteRestore?: () => void
}

interface UseNestedRouteReturn {
  /**
   * Function to close and restore the previous route
   */
  onClose: () => void
  /**
   * Whether the component is currently open
   */
  isOpen: boolean
}

/**
 * Hook to add routing capabilities to Sheet/Dialog components.
 *
 * This hook updates the browser URL to reflect UI state (like an open side panel) without
 * actually navigating to a new page. The nested route doesn't need to exist in Next.js's
 * file system - it's purely for URL state management.
 *
 * When the component opens, the nestedRoute is appended to the current URL while preserving
 * query parameters. When closed, the previous URL state is restored. This works by using
 * the browser's History API directly, bypassing Next.js routing.
 *
 * This is particularly useful for:
 * - Deep-linkable modals/sheets that users can bookmark or share
 * - Browser back/forward navigation support
 * - Preserving UI state in the URL without creating actual routes
 *
 * @example Basic usage with Sheet
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false)
 * const { onClose } = useNestedRoute({
 *   nestedRoute: 'create',
 *   isOpen,
 *   onOpenTrigger: () => setIsOpen(true),
 *   onCloseTrigger: () => setIsOpen(false),
 * })
 *
 * return (
 *   <>
 *     <Button onClick={() => setIsOpen(true)}>Create</Button>
 *     <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
 *       <SheetContent>
 *         <SheetHeader>
 *           <SheetTitle>Create Item</SheetTitle>
 *         </SheetHeader>
 *         {/* Your form content *\/}
 *       </SheetContent>
 *     </Sheet>
 *   </>
 * )
 * ```
 *
 * @example Dynamic nested routes (e.g., edit with ID)
 * ```tsx
 * const [selectedId, setSelectedId] = useState<string | null>(null)
 * const isOpen = selectedId !== null
 *
 * const { onClose } = useNestedRoute({
 *   nestedRoute: selectedId ? `edit/${selectedId}` : '',
 *   isOpen,
 *   onOpenTrigger: () => {
 *     // Extract ID from URL and open
 *     const id = router.asPath.split('/edit/')[1]
 *     setSelectedId(id)
 *   },
 *   onCloseTrigger: () => setSelectedId(null),
 * })
 *
 * return (
 *   <>
 *     <Button onClick={() => setSelectedId('123')}>Edit Item</Button>
 *     <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
 *       <SheetContent>
 *         <SheetHeader>
 *           <SheetTitle>Edit Item {selectedId}</SheetTitle>
 *         </SheetHeader>
 *         {/* Your edit form *\/}
 *       </SheetContent>
 *     </Sheet>
 *   </>
 * )
 * ```
 *
 * @example With cleanup callback
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false)
 * const { onClose } = useNestedRoute({
 *   nestedRoute: 'settings',
 *   isOpen,
 *   onOpenTrigger: () => setIsOpen(true),
 *   onCloseTrigger: () => setIsOpen(false),
 *   onRouteRestore: () => {
 *     // Cleanup or analytics tracking
 *     console.log('Settings sheet closed')
 *   },
 * })
 * ```
 */
export function useNestedRoute({
  nestedRoute,
  isOpen,
  onOpenTrigger,
  onCloseTrigger,
  onRouteRestore,
}: UseNestedRouteOptions): UseNestedRouteReturn {
  const router = useRouter()
  const previousPathRef = useRef<string | null>(null)
  const isNavigatingRef = useRef(false)
  const hasCheckedInitialUrl = useRef(false)

  // Normalize nested route (remove leading/trailing slashes)
  const normalizedRoute = nestedRoute.replace(/^\/+|\/+$/g, '')

  const onClose = useCallback(() => {
    if (isNavigatingRef.current) return

    isNavigatingRef.current = true

    // Restore the previous URL
    if (previousPathRef.current && typeof window !== 'undefined') {
      window.history.pushState(null, '', previousPathRef.current)
    }

    isNavigatingRef.current = false
    if (onCloseTrigger) onCloseTrigger()
    onRouteRestore?.()
  }, [onCloseTrigger, onRouteRestore])

  // Check if URL contains nested route on initial load
  useEffect(() => {
    if (!router.isReady || hasCheckedInitialUrl.current || typeof window === 'undefined') return

    hasCheckedInitialUrl.current = true

    const currentAsPath = router.asPath
    const [pathWithoutQuery] = currentAsPath.split('?')

    // Check if the current URL ends with the nested route
    if (normalizedRoute && pathWithoutQuery.endsWith(`/${normalizedRoute}`)) {
      // URL already contains the nested route, trigger open
      if (onOpenTrigger) onOpenTrigger()
    }
  }, [router.isReady, router.asPath, normalizedRoute, onOpenTrigger])

  useEffect(() => {
    if (!router.isReady || isNavigatingRef.current || typeof window === 'undefined') return

    if (isOpen) {
      // Use window.location.pathname because router.asPath might be stale after History API changes
      const currentPath = window.location.pathname + window.location.search
      const [pathWithoutQuery, queryString] = currentPath.split('?')

      // Check if URL already has the nested route (from initial load)
      const alreadyHasNestedRoute = pathWithoutQuery.endsWith(`/${normalizedRoute}`)

      if (alreadyHasNestedRoute) {
        // URL already contains the nested route (deep link scenario)
        // Store the parent path by removing the nested route
        if (!previousPathRef.current) {
          const parentPath = pathWithoutQuery.substring(
            0,
            pathWithoutQuery.length - normalizedRoute.length - 1
          )
          previousPathRef.current = parentPath + (queryString ? `?${queryString}` : '')
        }
      } else {
        // Normal flow: user clicked to open, append nested route to URL
        // First, determine the base path by checking if we're on a catch-all route
        // We need to strip any existing nested routes to get back to the true parent
        let basePath = pathWithoutQuery

        // Check if current path has any nested segments (e.g., /types/17702/edit or /types/new)
        // by comparing with router.pathname template
        const pathSegments = pathWithoutQuery.split('/').filter(Boolean)
        const pathnameSegments = router.pathname.split('/').filter(Boolean)

        // If we have more segments than the template pathname, we're on a nested route
        // Find the index where [...action] or similar catch-all would be
        const catchAllIndex = pathnameSegments.findIndex((seg) => seg.startsWith('[...'))
        if (catchAllIndex !== -1 && pathSegments.length > pathnameSegments.length - 1) {
          // We're on a catch-all route, strip back to the parent
          basePath = '/' + pathSegments.slice(0, catchAllIndex).join('/')
        }

        // Store current location before navigating
        if (!previousPathRef.current) {
          previousPathRef.current = basePath + (queryString ? `?${queryString}` : '')
        }

        // Build the new path with nested route from the base path
        const newPath = `${basePath}/${normalizedRoute}${queryString ? `?${queryString}` : ''}`

        // Update URL using History API without triggering Next.js navigation
        isNavigatingRef.current = true
        window.history.pushState(null, '', newPath)
        isNavigatingRef.current = false
      }
    } else if (previousPathRef.current) {
      // Reset the stored path when closed
      previousPathRef.current = null
    }
  }, [isOpen, router.isReady, normalizedRoute, router.pathname])

  // Handle browser back/forward navigation
  useEffect(() => {
    if (typeof window === 'undefined' || !router.isReady) return

    const handlePopState = () => {
      // User clicked back/forward - the URL has already changed by the browser
      // Check the current URL to determine if we should open or close
      const currentPath = window.location.pathname
      const shouldBeOpen = normalizedRoute && currentPath.endsWith(`/${normalizedRoute}`)

      previousPathRef.current = null

      if (shouldBeOpen && !isOpen) {
        // Forward navigation - panel should open
        if (onOpenTrigger) onOpenTrigger()
      } else if (!shouldBeOpen && isOpen) {
        // Back navigation - panel should close
        if (onCloseTrigger) onCloseTrigger()
        onRouteRestore?.()
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [isOpen, normalizedRoute, onOpenTrigger, onCloseTrigger, onRouteRestore, router.isReady])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (
        isOpen &&
        previousPathRef.current &&
        !isNavigatingRef.current &&
        typeof window !== 'undefined'
      ) {
        // Component unmounted while open, restore previous route
        window.history.pushState(null, '', previousPathRef.current)
      }
    }
  }, [])

  return {
    onClose,
    isOpen,
  }
}
