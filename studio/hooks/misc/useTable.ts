import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ENTITY_TYPE } from 'data/entity-types/entity-type-constants'
import { useForeignTableQuery } from 'data/foreign-tables/foreign-table-query'
import { useMaterializedViewQuery } from 'data/materialized-views/materialized-view-query'
import { useTableQuery } from 'data/tables/table-query'
import { useViewQuery } from 'data/views/view-query'
import useEntityType from './useEntityType'

/**
 * A hook that loads all table-like objects. e.g. tables, views, materialized views, etc...
 */
function useTable(id?: number) {
  const { project } = useProjectContext()
  const entity = useEntityType(id)

  const tableResult = useTableQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      id: entity?.id,
    },
    {
      enabled: entity?.type === ENTITY_TYPE.TABLE,
    }
  )

  const viewResult = useViewQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      id: entity?.id,
    },
    {
      enabled: entity?.type === ENTITY_TYPE.VIEW,
    }
  )

  const materializedViewResult = useMaterializedViewQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      id: entity?.id,
    },
    {
      enabled: entity?.type === ENTITY_TYPE.MATERIALIZED_VIEW,
    }
  )

  const foreignTableResult = useForeignTableQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      id: entity?.id,
    },
    {
      enabled: entity?.type === ENTITY_TYPE.FOREIGN_TABLE,
    }
  )

  switch (entity?.type) {
    case ENTITY_TYPE.TABLE:
      return tableResult
    case ENTITY_TYPE.VIEW:
      return viewResult
    case ENTITY_TYPE.MATERIALIZED_VIEW:
      return materializedViewResult
    case ENTITY_TYPE.FOREIGN_TABLE:
      return foreignTableResult
    default:
      // While entity is loading, we can fallback
      // to the loading state of the table query.
      return tableResult
  }
}

export default useTable
