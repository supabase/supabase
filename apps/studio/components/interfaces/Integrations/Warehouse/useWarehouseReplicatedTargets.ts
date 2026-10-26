import { useMemo } from 'react'

import {
  buildSchemasWithTables,
  buildSelectionFromPublicationTables,
  buildWarehouseSetupTargets,
  type WarehouseSetupTarget,
} from './Warehouse.utils'
import { useSchemasQuery } from '@/data/database/schemas-query'
import { useReplicationPublicationQuery } from '@/data/replication/publication-query'
import { useReplicationSourcesQuery } from '@/data/replication/sources-query'
import { useTablesQuery } from '@/data/tables/tables-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { WAREHOUSE_PUBLICATION_NAME } from '@/lib/warehouse'

/**
 * What's currently replicated, expressed in the same target shape enabling Warehouse submits.
 * `undefined` until every input has resolved, so callers can tell "not known yet" apart from
 * "nothing replicated".
 */
export function useWarehouseReplicatedTargets({
  projectRef,
}: {
  projectRef?: string
}): WarehouseSetupTarget[] | undefined {
  const { data: project } = useSelectedProjectQuery()

  const { data: schemas } = useSchemasQuery({
    projectRef,
    connectionString: project?.connectionString,
  })
  const { data: tables } = useTablesQuery({
    projectRef,
    connectionString: project?.connectionString,
  })

  const { data: sourcesData } = useReplicationSourcesQuery({ projectRef })
  const sourceId = sourcesData?.sources.find((source) => source.name === projectRef)?.id

  const { data: publication } = useReplicationPublicationQuery({
    projectRef,
    sourceId,
    publicationName: WAREHOUSE_PUBLICATION_NAME,
  })

  return useMemo(() => {
    if (!schemas || !tables || !publication) return undefined
    return buildWarehouseSetupTargets(
      buildSelectionFromPublicationTables(publication.tables),
      buildSchemasWithTables(schemas, tables)
    )
  }, [schemas, tables, publication])
}
