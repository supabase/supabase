import { useEffect, useMemo } from 'react'
import { parseAsString, useQueryState } from 'nuqs'
import { toast } from 'sonner'

interface UseQueryStateRoutingConfig<T> {
  /**
   * The query parameter key (e.g., 'edit', 'delete', 'duplicate')
   */
  key: string
  /**
   * Function to lookup the entity based on the selected ID
   * Return undefined when no ID is selected or entity not found
   */
  lookup: (selectedId: string | null) => T | undefined
  /**
   * Dependencies for the lookup function (e.g., [entities, entities?.length])
   * Controls when the entity lookup should re-run
   */
  lookupDeps: React.DependencyList
  /**
   * Loading state before determining if to show the "not found" error
   */
  isLoading?: boolean
  /**
   * Human-readable entity name for error messages (e.g., 'Database Function')
   */
  entityName: string
}

interface UseQueryStateRoutingReturn<T> {
  /**
   * The selected entity ID from the URL (or null if none)
   */
  selectedId: string | null
  /**
   * Function to set the selected entity ID (pass null to clear)
   */
  setSelectedId: (value: string | null) => Promise<URLSearchParams>
  /**
   * The entity result from the lookup function
   */
  entity: T | undefined
  /**
   * Whether to show the dialog (true when entity is found)
   */
  show: boolean
  /**
   * Whether the entity was not found (selectedId exists but entity is null/undefined)
   */
  notFound: boolean
}

/**
 * Hook for managing URL query parameters for entity-based operations with automatic error handling.
 *
 * This hook handles:
 * - URL query state management (via nuqs)
 * - Entity lookup with your custom logic
 * - Show/notFound state calculation
 * - Automatic "not found" error toast
 *
 * @example
 * // Basic usage with entity lookup
 * const { selectedId, setSelectedId, show, entity } = useQueryStateRouting({
 *   key: 'edit',
 *   lookup: (id) => id ? functions?.find(f => f.id.toString() === id) : undefined,
 *   lookupDeps: [functions],
 *   isLoading,
 *   entityName: 'Database Function',
 * })
 *
 * <EditDialog open={show} entity={entity} onClose={() => setSelectedId(null)} />
 *
 * @example
 * // With transformation (e.g., duplicate)
 * const { show, entity, setSelectedId } = useQueryStateRouting({
 *   key: 'duplicate',
 *   lookup: (id) => {
 *     if (!id) return undefined
 *     const original = functions?.find(f => f.id.toString() === id)
 *     return original ? { ...original, name: `${original.name}_duplicate` } : undefined
 *   },
 *   lookupDeps: [functions],
 *   isLoading,
 *   entityName: 'Database Function',
 * })
 *
 * @example
 * // Optimize for large lists - only re-lookup when length changes
 * const { entity } = useQueryStateRouting({
 *   key: 'edit',
 *   lookup: (id) => id ? largeList?.find(item => item.id === id) : undefined,
 *   lookupDeps: [largeList?.length], // Only re-run when list length changes
 *   entityName: 'Item',
 * })
 */
export function useQueryStateRouting<T = any>({
  key,
  lookup,
  lookupDeps,
  isLoading = false,
  entityName,
}: UseQueryStateRoutingConfig<T>): UseQueryStateRoutingReturn<T> {
  const [selectedId, setSelectedId] = useQueryState(
    key,
    parseAsString.withOptions({ history: 'push', clearOnDefault: true })
  )

  const entity = useMemo(() => lookup(selectedId), [selectedId, ...lookupDeps])

  const show = selectedId !== null && !!entity
  const notFound = selectedId !== null && !entity

  // Error handling when entity not found
  useEffect(() => {
    if (!isLoading && notFound) {
      toast.error(`${entityName} not found`)
      setSelectedId(null)
    }
  }, [isLoading, notFound, entityName, setSelectedId])

  return {
    selectedId,
    setSelectedId,
    entity,
    show,
    notFound,
  }
}
