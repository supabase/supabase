import { useEffect } from 'react'
import { parseAsString, useQueryState } from 'nuqs'
import { toast } from 'sonner'

// Entity state configuration
interface EntityStateConfig<T> {
  key: string
  entities: T[] | undefined
  isLoading?: boolean
  idField: keyof T
  entityName: string
  transformId?: (id: any) => string
  transformDuplicate?: (entity: T) => T
}

// Entity state return type
interface EntityState<T> {
  selectedId: string | null
  setSelectedId: (value: string | null) => Promise<URLSearchParams>
  entity: T | undefined
  show: boolean
  notFound: boolean
}

/**
 * Hook for managing URL query parameters for entity-based operations.
 *
 * This hook provides entity state management with automatic entity lookup,
 * error handling, and URL synchronization. Use this for edit/delete/duplicate
 * operations where you need to track which entity is selected.
 *
 * For simple boolean state (e.g., create dialogs), use `useQueryState` from nuqs directly:
 * ```
 * import { parseAsBoolean, useQueryState } from 'nuqs'
 * const [show, setShow] = useQueryState('new', parseAsBoolean.withDefault(false))
 * ```
 *
 * @example
 * // Entity state (for edit/delete/duplicate)
 * const editState = useQueryStateRouting({
 *   key: 'edit',
 *   entities: users,
 *   isLoading,
 *   idField: 'id',
 *   entityName: 'User',
 *   transformId: (id) => id.toString(),
 * })
 * <EditDialog open={editState.show} entity={editState.entity} />
 *
 * @example
 * // Entity state with duplicate transformation
 * const duplicateState = useQueryStateRouting({
 *   key: 'duplicate',
 *   entities: functions,
 *   isLoading,
 *   idField: 'id',
 *   entityName: 'Database Function',
 *   transformId: (id) => id.toString(),
 *   transformDuplicate: (fn) => ({
 *     ...fn,
 *     name: `${fn.name}_copy`,
 *   }),
 * })
 */
export function useQueryStateRouting<T = any>(config: EntityStateConfig<T>): EntityState<T> {
  const {
    key,
    entities,
    isLoading = false,
    idField,
    entityName,
    transformId = (id: unknown) => String(id),
    transformDuplicate,
  } = config

  const [selectedId, setSelectedId] = useQueryState(
    key,
    parseAsString.withOptions({ history: 'push', clearOnDefault: true })
  )

  const originalEntity = selectedId
    ? entities?.find((entity) => {
        const id = idField as keyof T
        return transformId(entity[id]) === selectedId
      })
    : undefined

  const entity =
    originalEntity && transformDuplicate ? transformDuplicate(originalEntity) : originalEntity

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
