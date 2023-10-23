import { useQueryClient } from '@tanstack/react-query'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { Entity, useEntityTypeQuery } from 'data/entity-types/entity-type-query'
import { entityTypeKeys } from 'data/entity-types/keys'
import { useMemo } from 'react'

/**
 * Tries to load an entity type from the cached list of entity types, or fetches it from the server.
 */
function useEntityType(id?: number, onNotFound?: (id: number) => void) {
  const queryClient = useQueryClient()
  const { project } = useProjectContext()

  const existingEntity = useMemo(
    () =>
      (
        queryClient.getQueryCache().find(entityTypeKeys.list(project?.ref))?.state.data as any
      )?.pages
        ?.flatMap((page: any) => page.data.entities)
        ?.find((entity: any) => entity.id === id) as Entity | undefined,
    [project?.ref, id]
  )

  const { data: entity } = useEntityTypeQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      id,
    },
    {
      enabled: !existingEntity,
      onSettled(data) {
        if (!data && id !== undefined) {
          onNotFound?.(id)
        }
      },
    }
  )

  return existingEntity ?? entity
}

export default useEntityType
