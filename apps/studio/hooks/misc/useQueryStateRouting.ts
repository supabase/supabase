import { useEffect } from 'react'
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs'
import { toast } from 'sonner'

type EntityOperation = 'edit' | 'delete' | 'duplicate'

interface UseQueryStateRoutingConfig<T> {
  /**
   * Boolean operations with custom keys (e.g., ['new', 'invite'])
   * These will create query params like ?new=true or ?invite=true
   */
  booleanOperations?: string[]
  /**
   * Entity operations: 'edit', 'delete', 'duplicate'
   * These work with entity IDs in query params
   */
  entityOperations?: EntityOperation[]
  /**
   * The list of entities to search through (required if using entityOperations)
   */
  entities?: T[] | undefined
  /**
   * Loading state for the entities (required if using entityOperations)
   */
  isLoading?: boolean
  /**
   * Field to use as the identifier (required if using entityOperations)
   */
  idField?: keyof T
  /**
   * Name of the entity for error messages (required if using entityOperations)
   */
  entityName?: string
  /**
   * Optional transformer for duplicate operation
   */
  transformDuplicate?: (entity: T) => T
  /**
   * Optional transformer to convert identifier to string for comparison
   */
  transformId?: (id: any) => string
}

interface BooleanOperationState {
  show: boolean
  setShow: (value: boolean | null) => Promise<URLSearchParams>
}

interface EntityOperationState<T> {
  selectedId: string
  setSelectedId: (value: string | null) => Promise<URLSearchParams>
  entity: T | undefined
  show: boolean
  notFound: boolean
}

interface UseQueryStateRoutingReturn<T> {
  // Dynamic boolean operations
  booleans: Record<string, BooleanOperationState>

  // Entity operations (optional)
  edit?: EntityOperationState<T>
  delete?: EntityOperationState<T>
  duplicate?: EntityOperationState<T>
}

/**
 * Hook for managing URL query parameters for CRUD operations on entities.
 *
 * This hook provides a declarative way to handle routing state for entity operations
 * (create, edit, delete, duplicate) using URL query parameters. It supports:
 * - Custom boolean operations (e.g., ?new, ?invite, ?create)
 * - Entity-based operations that track which entity is being edited/deleted/duplicated
 * - Automatic error handling with toast notifications when entities are not found
 *
 * @example
 * // Boolean operations only (no entity required)
 * const routing = useQueryStateRouting({
 *   booleanOperations: ['new'],
 * })
 *
 * <CreateDialog open={routing.booleans.new.show} onOpenChange={routing.booleans.new.setShow} />
 *
 * @example
 * // Multiple boolean operations for different actions
 * const routing = useQueryStateRouting({
 *   booleanOperations: ['new', 'invite', 'import'], // Creates ?new=true, ?invite=true, ?import=true
 * })
 *
 * // Use different dialogs based on query params
 * <CreateUserDialog open={routing.booleans.new.show} />
 * <InviteUserDialog open={routing.booleans.invite.show} />
 * <ImportUsersDialog open={routing.booleans.import.show} />
 *
 * @example
 * // With entity operations (requires entity fields)
 * const routing = useQueryStateRouting({
 *   entities: users,
 *   isLoading,
 *   idField: 'id',
 *   booleanOperations: ['new'],
 *   entityOperations: ['edit', 'delete'],
 *   entityName: 'User',
 *   transformId: (id) => id.toString(),
 * })
 *
 * // Access both boolean and entity operations
 * <CreateDialog open={routing.booleans.new.show} />
 * <EditDialog open={routing.edit!.show} entity={routing.edit!.entity} />
 * <DeleteDialog open={routing.delete!.show} entity={routing.delete!.entity} />
 *
 * @example
 * // With duplicate operation and custom transformer
 * const routing = useQueryStateRouting({
 *   entities: functions,
 *   isLoading,
 *   idField: 'id',
 *   booleanOperations: ['new'],
 *   entityOperations: ['edit', 'delete', 'duplicate'],
 *   entityName: 'Database Function',
 *   transformDuplicate: (fn) => ({
 *     ...fn,
 *     name: `${fn.name}_copy`,
 *   }),
 *   transformId: (id) => id.toString(),
 * })
 *
 * @template T - The type of entity being managed
 * @param config - Configuration object for the hook
 * @param config.entities - Array of entities to search through
 * @param config.isLoading - Loading state used for error handling timing
 * @param config.idField - The field name to use as the unique identifier
 * @param config.booleanOperations - Array of arbitrary boolean operation keys (e.g., ['new', 'invite'])
 * @param config.entityOperations - Array of common entity operations ('edit', 'delete', 'duplicate')
 * @param config.entityName - Human-readable name for error messages
 * @param config.transformDuplicate - Optional function to transform entity when duplicating
 * @param config.transformId - Optional function to convert entity ID to string for comparison
 * @returns Object containing boolean states and entity operation states
 */
export function useQueryStateRouting<T = any>({
  booleanOperations = [],
  entityOperations = [],
  entities,
  isLoading = false,
  idField,
  entityName,
  transformDuplicate,
  transformId = (id: unknown) => String(id),
}: UseQueryStateRoutingConfig<T> = {}): UseQueryStateRoutingReturn<T> {
  // Setup boolean operations
  const booleanStates: Record<string, BooleanOperationState> = {}

  booleanOperations.forEach((key) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [show, setShow] = useQueryState(
      key,
      parseAsBoolean.withDefault(false).withOptions({ history: 'push', clearOnDefault: true })
    )
    booleanStates[key] = { show, setShow }
  })

  // Setup entity operations
  const includesEdit = entityOperations.includes('edit')
  const includesDelete = entityOperations.includes('delete')
  const includesDuplicate = entityOperations.includes('duplicate')

  // Edit operation
  const [selectedIdToEdit, setSelectedIdToEdit] = useQueryState(
    'edit',
    parseAsString.withDefault('').withOptions({ history: 'push', clearOnDefault: true })
  )

  const entityToEdit =
    includesEdit && idField
      ? entities?.find((entity) => transformId(entity[idField!]) === selectedIdToEdit)
      : undefined
  const showEntityToEdit = includesEdit && selectedIdToEdit !== '' && !!entityToEdit
  const entityToEditNotFound = includesEdit && selectedIdToEdit !== '' && !entityToEdit

  // Delete operation
  const [selectedIdToDelete, setSelectedIdToDelete] = useQueryState(
    'delete',
    parseAsString.withDefault('').withOptions({ history: 'push', clearOnDefault: true })
  )

  const entityToDelete =
    includesDelete && idField
      ? entities?.find((entity) => transformId(entity[idField!]) === selectedIdToDelete)
      : undefined
  const showEntityToDelete = includesDelete && selectedIdToDelete !== '' && !!entityToDelete
  const entityToDeleteNotFound = includesDelete && selectedIdToDelete !== '' && !entityToDelete

  // Duplicate operation
  const [selectedIdToDuplicate, setSelectedIdToDuplicate] = useQueryState(
    'duplicate',
    parseAsString.withDefault('').withOptions({ history: 'push', clearOnDefault: true })
  )

  const originalEntityToDuplicate =
    includesDuplicate && idField
      ? entities?.find((entity) => transformId(entity[idField!]) === selectedIdToDuplicate)
      : undefined
  const entityToDuplicate =
    includesDuplicate && originalEntityToDuplicate && transformDuplicate
      ? transformDuplicate(originalEntityToDuplicate)
      : originalEntityToDuplicate

  const showEntityToDuplicate =
    includesDuplicate && selectedIdToDuplicate !== '' && !!entityToDuplicate
  const entityToDuplicateNotFound =
    includesDuplicate && selectedIdToDuplicate !== '' && !entityToDuplicate

  // Error handling for edit
  useEffect(() => {
    if (includesEdit && !isLoading && entityToEditNotFound) {
      toast.error(`${entityName} not found`)
      setSelectedIdToEdit('')
    }
  }, [
    includesEdit,
    selectedIdToEdit,
    entityToEdit,
    isLoading,
    entityName,
    entityToEditNotFound,
    setSelectedIdToEdit,
  ])

  // Error handling for delete
  useEffect(() => {
    if (includesDelete && !isLoading && entityToDeleteNotFound) {
      toast.error(`${entityName} not found`)
      setSelectedIdToDelete('')
    }
  }, [
    includesDelete,
    selectedIdToDelete,
    entityToDelete,
    isLoading,
    entityName,
    entityToDeleteNotFound,
    setSelectedIdToDelete,
  ])

  // Error handling for duplicate
  useEffect(() => {
    if (includesDuplicate && !isLoading && entityToDuplicateNotFound) {
      toast.error(`${entityName} not found`)
      setSelectedIdToDuplicate('')
    }
  }, [
    includesDuplicate,
    selectedIdToDuplicate,
    entityToDuplicate,
    isLoading,
    entityName,
    entityToDuplicateNotFound,
    setSelectedIdToDuplicate,
  ])

  const result: UseQueryStateRoutingReturn<T> = {
    booleans: booleanStates,
  }

  if (includesEdit) {
    result.edit = {
      selectedId: selectedIdToEdit,
      setSelectedId: setSelectedIdToEdit,
      entity: entityToEdit,
      show: showEntityToEdit,
      notFound: entityToEditNotFound,
    }
  }

  if (includesDelete) {
    result.delete = {
      selectedId: selectedIdToDelete,
      setSelectedId: setSelectedIdToDelete,
      entity: entityToDelete,
      show: showEntityToDelete,
      notFound: entityToDeleteNotFound,
    }
  }

  if (includesDuplicate) {
    result.duplicate = {
      selectedId: selectedIdToDuplicate,
      setSelectedId: setSelectedIdToDuplicate,
      entity: entityToDuplicate,
      show: showEntityToDuplicate,
      notFound: entityToDuplicateNotFound,
    }
  }

  return result
}
