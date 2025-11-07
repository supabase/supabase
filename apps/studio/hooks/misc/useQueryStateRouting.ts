import { useEffect } from 'react'
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs'
import { toast } from 'sonner'

interface UseQueryStateRoutingConfig<T> {
  /**
   * The list of entities to search through
   */
  entities: T[] | undefined
  /**
   * Loading state for the entities
   */
  isLoading: boolean
  /**
   * Field to use as the identifier (e.g., 'id', 'name')
   */
  idField: keyof T
  /**
   * Operations to enable. Defaults to ['new', 'edit', 'delete']
   */
  operations?: Array<'new' | 'edit' | 'delete' | 'duplicate'>
  /**
   * Name of the entity for error messages (e.g., 'Database Function', 'Index')
   */
  entityName: string
  /**
   * Optional transformer for duplicate operation
   */
  transformDuplicate?: (entity: T) => T
  /**
   * Optional transformer to convert identifier to string for comparison
   */
  idToString?: (id: any) => string
}

interface UseQueryStateRoutingReturn<T> {
  // New operation
  showCreate: boolean
  setShowCreate: (value: boolean | null) => Promise<URLSearchParams>

  // Edit operation
  selectedIdToEdit: string
  setSelectedIdToEdit: (value: string | null) => Promise<URLSearchParams>
  entityToEdit: T | undefined
  showEntityToEdit: boolean
  entityToEditNotFound: boolean

  // Delete operation
  selectedIdToDelete: string
  setSelectedIdToDelete: (value: string | null) => Promise<URLSearchParams>
  entityToDelete: T | undefined
  showEntityToDelete: boolean
  entityToDeleteNotFound: boolean

  // Duplicate operation (optional)
  selectedIdToDuplicate: string
  setSelectedIdToDuplicate: (value: string | null) => Promise<URLSearchParams>
  entityToDuplicate: T | undefined
  showEntityToDuplicate: boolean
  entityToDuplicateNotFound: boolean
}

export function useQueryStateRouting<T>({
  entities,
  isLoading,
  idField,
  operations = ['new', 'edit', 'delete'],
  entityName,
  transformDuplicate,
  idToString = (id: unknown) => String(id),
}: UseQueryStateRoutingConfig<T>): UseQueryStateRoutingReturn<T> {
  const includesEdit = operations.includes('edit')
  const includesDelete = operations.includes('delete')
  const includesDuplicate = operations.includes('duplicate')

  // New operation
  const [showCreate, setShowCreate] = useQueryState(
    'new',
    parseAsBoolean.withDefault(false).withOptions({ history: 'push', clearOnDefault: true })
  )

  // Edit operation
  const [selectedIdToEdit, setSelectedIdToEdit] = useQueryState(
    'edit',
    parseAsString.withDefault('').withOptions({ history: 'push', clearOnDefault: true })
  )

  const entityToEdit = entities?.find((entity) => idToString(entity[idField]) === selectedIdToEdit)
  const showEntityToEdit = selectedIdToEdit !== '' && !!entityToEdit
  const entityToEditNotFound = selectedIdToEdit !== '' && !entityToEdit

  // Delete operation
  const [selectedIdToDelete, setSelectedIdToDelete] = useQueryState(
    'delete',
    parseAsString.withDefault('').withOptions({ history: 'push', clearOnDefault: true })
  )

  const entityToDelete = entities?.find(
    (entity) => idToString(entity[idField]) === selectedIdToDelete
  )
  const showEntityToDelete = selectedIdToDelete !== '' && !!entityToDelete
  const entityToDeleteNotFound = selectedIdToDelete !== '' && !entityToDelete

  // Duplicate operation
  const [selectedIdToDuplicate, setSelectedIdToDuplicate] = useQueryState(
    'duplicate',
    parseAsString.withDefault('').withOptions({ history: 'push', clearOnDefault: true })
  )

  const originalEntityToDuplicate = entities?.find(
    (entity) => idToString(entity[idField]) === selectedIdToDuplicate
  )
  const entityToDuplicate =
    originalEntityToDuplicate && transformDuplicate
      ? transformDuplicate(originalEntityToDuplicate)
      : originalEntityToDuplicate

  const showEntityToDuplicate = selectedIdToDuplicate !== '' && !!entityToDuplicate
  const entityToDuplicateNotFound = selectedIdToDuplicate !== '' && !entityToDuplicate

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

  return {
    // New
    showCreate,
    setShowCreate,
    // Edit
    selectedIdToEdit,
    setSelectedIdToEdit,
    entityToEdit,
    showEntityToEdit,
    entityToEditNotFound,
    // Delete
    selectedIdToDelete,
    setSelectedIdToDelete,
    entityToDelete,
    showEntityToDelete,
    entityToDeleteNotFound,
    // Duplicate
    selectedIdToDuplicate,
    setSelectedIdToDuplicate,
    entityToDuplicate,
    showEntityToDuplicate,
    entityToDuplicateNotFound,
  }
}
