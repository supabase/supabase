import { useEffect } from 'react'
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs'
import { toast } from 'sonner'

// Boolean state configuration
interface BooleanStateConfig {
  key: string
}

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

// Boolean state return type
interface BooleanState {
  show: boolean
  setShow: (value: boolean | null) => Promise<URLSearchParams>
}

// Entity state return type
interface EntityState<T> {
  selectedId: string | null
  setSelectedId: (value: string | null) => Promise<URLSearchParams>
  entity: T | undefined
  show: boolean
  notFound: boolean
}

// Function overloads for type safety
export function useQueryStateRouting(config: BooleanStateConfig): BooleanState
export function useQueryStateRouting<T>(config: EntityStateConfig<T>): EntityState<T>

/**
 * Hook for managing URL query parameters for UI state.
 *
 * This hook provides a declarative way to handle routing state using URL query parameters.
 * It supports two modes:
 * 1. Boolean state - Simple on/off state (e.g., ?new=true)
 * 2. Entity state - Track which entity is selected (e.g., ?edit=123)
 *
 * @example
 * // Boolean state (for create dialogs, etc.)
 * const { show, setShow } = useQueryStateRouting({ key: 'new' })
 * <CreateDialog open={show} onOpenChange={setShow} />
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
export function useQueryStateRouting<T = any>(
  config: BooleanStateConfig | EntityStateConfig<T>
): BooleanState | EntityState<T> {
  // Check if this is entity state by looking for entity-specific properties
  const isEntityState = 'idField' in config || 'entityName' in config

  // Boolean state mode
  if (!isEntityState) {
    const { key } = config as BooleanStateConfig
    const [show, setShow] = useQueryState(
      key,
      parseAsBoolean.withDefault(false).withOptions({ history: 'push', clearOnDefault: true })
    )
    return { show, setShow }
  }

  // Entity state mode
  const {
    key,
    entities,
    isLoading = false,
    idField,
    entityName,
    transformId = (id: unknown) => String(id),
    transformDuplicate,
  } = config as EntityStateConfig<T>

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
