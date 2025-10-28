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
   * Whether to use shallow routing (default: true)
   * Shallow routing updates the URL without re-running data fetching methods
   */
  shallow?: boolean
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
 * When the component opens, the nestedRoute is appended to the current URL while preserving
 * query parameters. When closed, the previous URL state is restored.
 *
 * This is particularly useful for:
 * - Deep-linkable modals/sheets that users can bookmark or share
 * - Browser back/forward navigation support
 * - Preserving UI state in the URL
 *
 * @example Basic usage with Sheet
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false)
 * const { onClose } = useNestedRoute({
 *   nestedRoute: 'create',
 *   isOpen,
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
  shallow = true,
  onRouteRestore,
}: UseNestedRouteOptions): UseNestedRouteReturn {
  const router = useRouter()
  const previousPathRef = useRef<string | null>(null)
  const previousQueryRef = useRef<Record<string, string | string[]>>({})
  const isNavigatingRef = useRef(false)

  // Normalize nested route (remove leading/trailing slashes)
  const normalizedRoute = nestedRoute.replace(/^\/+|\/+$/g, '')

  const onClose = useCallback(() => {
    if (isNavigatingRef.current) return

    isNavigatingRef.current = true

    // Restore the previous path and query
    if (previousPathRef.current) {
      router
        .push(
          {
            pathname: previousPathRef.current,
            query: previousQueryRef.current,
          },
          undefined,
          { shallow }
        )
        .finally(() => {
          isNavigatingRef.current = false
          onRouteRestore?.()
        })
    } else {
      isNavigatingRef.current = false
      onRouteRestore?.()
    }
  }, [router, shallow, onRouteRestore])

  useEffect(() => {
    if (!router.isReady || isNavigatingRef.current) return

    if (isOpen) {
      // Store current location before navigating
      const currentPath = router.pathname
      // Filter out undefined values from query
      const currentQuery = Object.entries(router.query).reduce(
        (acc, [key, value]) => {
          if (value !== undefined) {
            acc[key] = value
          }
          return acc
        },
        {} as Record<string, string | string[]>
      )

      // Only store if we haven't stored yet (prevents overwriting on re-renders)
      if (!previousPathRef.current) {
        previousPathRef.current = currentPath
        previousQueryRef.current = currentQuery
      }

      // Build the new path with nested route
      const currentAsPath = router.asPath.split('?')[0]
      const newPath = `${currentAsPath}/${normalizedRoute}`

      // Preserve query params
      const newQuery = { ...currentQuery }

      // Navigate to nested route
      isNavigatingRef.current = true
      router
        .push(
          {
            pathname: newPath,
            query: newQuery,
          },
          undefined,
          { shallow }
        )
        .finally(() => {
          isNavigatingRef.current = false
        })
    } else if (previousPathRef.current) {
      // Reset the stored path when closed
      previousPathRef.current = null
      previousQueryRef.current = {}
    }
  }, [isOpen, router.isReady, normalizedRoute, shallow])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isOpen && previousPathRef.current && !isNavigatingRef.current) {
        // Component unmounted while open, restore previous route
        router.push(
          {
            pathname: previousPathRef.current,
            query: previousQueryRef.current,
          },
          undefined,
          { shallow }
        )
      }
    }
  }, [])

  return {
    onClose,
    isOpen,
  }
}
