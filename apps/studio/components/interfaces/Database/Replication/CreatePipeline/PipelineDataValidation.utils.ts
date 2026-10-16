import type { FieldPath } from 'react-hook-form'

import {
  DestinationPanelFormSchema,
  type DestinationPanelSchemaType,
} from '../DestinationPanel/DestinationForm/DestinationForm.schema'
import { buildTableSyncCopyConfig } from '../DestinationPanel/DestinationForm/DestinationForm.utils'
import type { ReplicationPublicationData } from '@/data/replication/publication-query'

const dataSchema = DestinationPanelFormSchema.pick({
  publicationName: true,
  tableSyncCopyMode: true,
  tableSyncCopyTableIds: true,
  maxFillMs: true,
  maxTableSyncWorkers: true,
  maxCopyConnectionsPerTable: true,
  invalidatedSlotBehavior: true,
})
export const dataFieldNames = [...Object.keys(dataSchema.shape), 'tableOptions'].filter(
  (name): name is keyof DestinationPanelSchemaType => name in DestinationPanelFormSchema.shape
)

export const getDataValidationIssues = (
  data: DestinationPanelSchemaType,
  type: string,
  publication?: ReplicationPublicationData
) => {
  const schema =
    type === 'BigQuery'
      ? dataSchema.extend({ tableOptions: DestinationPanelFormSchema.shape.tableOptions })
      : dataSchema
  const result = schema.safeParse(data)
  const issues = result.success
    ? []
    : result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }))
  if (!publication || publication.name !== data.publicationName) {
    issues.push({ path: 'publicationName', message: 'Select an available publication.' })
  } else if (
    data.tableSyncCopyMode === 'include_tables' ||
    data.tableSyncCopyMode === 'skip_tables'
  ) {
    try {
      buildTableSyncCopyConfig({
        mode: data.tableSyncCopyMode,
        selectedTableIds: data.tableSyncCopyTableIds,
      })
      const ids = new Set(publication.tables.map(({ id }) => String(id)))
      if (data.tableSyncCopyTableIds.some((id) => !ids.has(id))) {
        issues.push({
          path: 'tableSyncCopyTableIds',
          message: 'Some selected tables are no longer in the publication. Update your selection.',
        })
      }
    } catch (error) {
      issues.push({
        path: 'tableSyncCopyTableIds',
        message: error instanceof Error ? error.message : 'Select initial sync tables.',
      })
    }
  }
  return issues.filter(
    (issue): issue is { path: FieldPath<DestinationPanelSchemaType>; message: string } =>
      issue.path.split('.')[0] in DestinationPanelFormSchema.shape
  )
}
