import { getAnalyticsBucketValidationIssues } from '../DestinationPanel/DestinationForm/AnalyticsBucket/AnalyticsBucket.utils'
import { getBigQueryValidationIssues } from '../DestinationPanel/DestinationForm/BigQuery/BigQuery.utils'
import { getClickHouseValidationIssues } from '../DestinationPanel/DestinationForm/ClickHouse/ClickHouse.utils'
import type { DestinationPanelSchemaType } from '../DestinationPanel/DestinationForm/DestinationForm.schema'
import { pruneStaleSelectedTableIds } from '../DestinationPanel/DestinationForm/DestinationForm.utils'
import { getDucklakeValidationIssues } from '../DestinationPanel/DestinationForm/DuckLake/DuckLake.utils'
import { getSnowflakeValidationIssues } from '../DestinationPanel/DestinationForm/Snowflake/Snowflake.utils'
import type { DestinationType } from '../DestinationPanel/DestinationPanel.types'
import type { ReplicationPublication } from '@/data/replication/publications-query'

export const PIPELINE_CREATE_STEPS = [
  { id: 'destination', label: 'Destination', description: 'Choose where data should go' },
  { id: 'connection', label: 'Connection', description: 'Authorize the destination' },
  { id: 'data', label: 'Data', description: 'Choose a publication and initial sync' },
  { id: 'review', label: 'Review', description: 'Confirm and create the pipeline' },
] as const

export type PipelineCreateStepId = (typeof PIPELINE_CREATE_STEPS)[number]['id']

export type PipelineDestinationType = Exclude<DestinationType, 'Read Replica'>

export const PIPELINE_DESTINATION_TYPES: PipelineDestinationType[] = [
  'BigQuery',
  'Analytics Bucket',
  'DuckLake',
  'Snowflake',
  'ClickHouse',
]

export const isPipelineDestinationType = (
  value: string | null | undefined
): value is PipelineDestinationType =>
  value != null && PIPELINE_DESTINATION_TYPES.includes(value as PipelineDestinationType)

export const getFirstEnabledPipelineType = (
  enabled: Partial<Record<PipelineDestinationType, boolean>>
): PipelineDestinationType | null =>
  PIPELINE_DESTINATION_TYPES.find((type) => enabled[type]) ?? null

export const getCreatePipelineHref = (
  projectRef: string,
  destinationType?: PipelineDestinationType | null
) => {
  const path = `/project/${projectRef}/database/replication/new`
  if (!destinationType) return path
  return `${path}?destinationType=${encodeURIComponent(destinationType)}`
}

export const hasValidConnection = ({
  type,
  data,
}: {
  type: PipelineDestinationType
  data: DestinationPanelSchemaType
}): boolean => {
  if (!data.name?.trim()) return false

  if (type === 'BigQuery') return getBigQueryValidationIssues(data).length === 0
  if (type === 'Analytics Bucket') return getAnalyticsBucketValidationIssues(data).length === 0
  if (type === 'DuckLake') return getDucklakeValidationIssues(data).length === 0
  if (type === 'Snowflake') return getSnowflakeValidationIssues(data).length === 0
  if (type === 'ClickHouse') return getClickHouseValidationIssues(data).length === 0

  return false
}

export const hasValidDataStep = ({
  publicationName,
  tableSyncCopyMode,
  tableSyncCopyTableIds,
  publications,
}: {
  publicationName: string
  tableSyncCopyMode: DestinationPanelSchemaType['tableSyncCopyMode']
  tableSyncCopyTableIds: string[]
  publications: ReplicationPublication[]
}): boolean => {
  if (!publicationName) return false

  const publicationNames = publications.map((publication) => publication.name)
  if (!publicationNames.includes(publicationName)) return false

  const selectedTableIds = pruneStaleSelectedTableIds({
    mode: tableSyncCopyMode,
    selectedTableIds: tableSyncCopyTableIds,
    publications,
    publicationName,
  })

  if (
    (tableSyncCopyMode === 'include_tables' || tableSyncCopyMode === 'skip_tables') &&
    selectedTableIds.length === 0
  ) {
    return false
  }

  return true
}
