import { getAnalyticsBucketValidationIssues } from '../DestinationPanel/DestinationForm/AnalyticsBucket/AnalyticsBucket.utils'
import { getBigQueryValidationIssues } from '../DestinationPanel/DestinationForm/BigQuery/BigQuery.utils'
import { getClickHouseValidationIssues } from '../DestinationPanel/DestinationForm/ClickHouse/ClickHouse.utils'
import type { DestinationPanelSchemaType } from '../DestinationPanel/DestinationForm/DestinationForm.schema'
import { pruneStaleSelectedTableIds } from '../DestinationPanel/DestinationForm/DestinationForm.utils'
import { getDucklakeValidationIssues } from '../DestinationPanel/DestinationForm/DuckLake/DuckLake.utils'
import { getSnowflakeValidationIssues } from '../DestinationPanel/DestinationForm/Snowflake/Snowflake.utils'
import type { DestinationType } from '../DestinationPanel/DestinationPanel.types'
import type { ReplicationPublication } from '@/data/replication/publications-query'
import { DOCS_URL } from '@/lib/constants'

export const PIPELINE_CREATE_DOCS_URL = `${DOCS_URL}/guides/database/replication#pipelines`

export const PIPELINE_PUBLICATION_DOCS_URL = `${DOCS_URL}/guides/database/replication/pipelines#step-1-create-a-postgres-publication`

export const getDestinationSetupDocsUrl = (destinationType: DestinationType) =>
  destinationType === 'BigQuery'
    ? `${DOCS_URL}/guides/database/replication/bigquery#configure-bigquery-as-a-destination`
    : `${DOCS_URL}/guides/database/replication/pipelines#step-3-configure-a-destination`

export type PipelineDestinationType = DestinationType

export const PIPELINE_DESTINATION_TYPES: PipelineDestinationType[] = [
  'BigQuery',
  'Analytics Bucket',
  'DuckLake',
  'Snowflake',
  'ClickHouse',
]

export const PIPELINE_CREATE_STEPS = [
  {
    id: 'destination',
    label: 'Destination',
    title: 'Choose a destination',
    description: 'Where should this database be replicated?',
  },
  {
    id: 'connection',
    label: 'Connection',
    title: 'Authorize the destination',
    description: 'Name this pipeline and enter credentials for {destination}.',
  },
  {
    id: 'data',
    label: 'Data',
    title: 'Choose what to replicate',
    description: 'Select a publication and which existing rows to copy during initial sync.',
  },
  {
    id: 'review',
    label: 'Review',
    title: 'Review and create',
    description: 'Check these details, then create and start the pipeline.',
  },
] as const

export type PipelineCreateStepId = (typeof PIPELINE_CREATE_STEPS)[number]['id']

export const getPipelineCreateStepDocsUrl = (
  step: PipelineCreateStepId,
  destinationType?: PipelineDestinationType
): string | null => {
  if (step === 'connection' && destinationType) {
    return getDestinationSetupDocsUrl(destinationType)
  }

  if (step === 'data') {
    return PIPELINE_PUBLICATION_DOCS_URL
  }

  return null
}

export const getPipelineCreateStepHeader = (
  id: PipelineCreateStepId,
  vars?: { destinationType?: PipelineDestinationType }
) => {
  const step = PIPELINE_CREATE_STEPS.find((item) => item.id === id)!
  return {
    title: step.title,
    description: step.description.replace(
      '{destination}',
      vars?.destinationType ?? 'the destination'
    ),
  }
}

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

export const hasCreatePipelineUnsavedChanges = ({
  isDirty,
  step,
}: {
  isDirty: boolean
  step: PipelineCreateStepId
}) => isDirty || step !== 'destination'

export const getCreatePipelineSubmitLabel = ({
  hasRunValidation,
  hasCriticalFailures,
  warningCount,
}: {
  hasRunValidation: boolean
  hasCriticalFailures: boolean
  warningCount: number
}) => {
  if (hasRunValidation && warningCount > 0 && !hasCriticalFailures) {
    return 'Create and start pipeline anyway'
  }
  return 'Create and start pipeline'
}

export const isCreatePipelineSubmitDisabled = ({
  isSaving,
  isSuccessPublications,
  isSelectedPublicationMissing,
  hasNoAvailableDestinations,
}: {
  isSaving: boolean
  isSuccessPublications: boolean
  isSelectedPublicationMissing: boolean
  hasNoAvailableDestinations: boolean
}) =>
  isSaving || !isSuccessPublications || isSelectedPublicationMissing || hasNoAvailableDestinations

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

const PIPELINE_CREATE_CONNECTION_STEP_FIELDS: Record<
  PipelineDestinationType,
  (keyof DestinationPanelSchemaType)[]
> = {
  BigQuery: ['name', 'projectId', 'datasetId', 'serviceAccountKey'],
  'Analytics Bucket': [
    'name',
    'warehouseName',
    'namespace',
    'newNamespaceName',
    's3Region',
    's3AccessKeyId',
    's3SecretAccessKey',
  ],
  DuckLake: [
    'name',
    'ducklakeMode',
    'ducklakeCatalogUrl',
    'ducklakeDataPath',
    'ducklakeS3AccessKeyId',
    'ducklakeS3SecretAccessKey',
    'ducklakeS3Region',
    'ducklakeS3Endpoint',
    'ducklakeMetadataSchema',
    'ducklakeCatalogProjectRef',
    'ducklakeStorageProjectRef',
    'ducklakeStorageBucket',
  ],
  Snowflake: [
    'name',
    'snowflakeAccountId',
    'snowflakeUser',
    'snowflakePrivateKey',
    'snowflakeDatabase',
    'snowflakeSchema',
  ],
  ClickHouse: ['name', 'clickhouseUrl', 'clickhouseUser', 'clickhouseDatabase'],
}

export const getPipelineCreateConnectionStepFieldNames = (type: PipelineDestinationType) =>
  PIPELINE_CREATE_CONNECTION_STEP_FIELDS[type]

export const PIPELINE_CREATE_DATA_STEP_FIELD_NAMES = [
  'publicationName',
  'tableSyncCopyTableIds',
] as const satisfies readonly (keyof DestinationPanelSchemaType)[]

const PIPELINE_CREATE_SHARED_FIELD_NAMES = [
  'name',
  'publicationName',
  'tableSyncCopyMode',
  'tableSyncCopyTableIds',
  'maxFillMs',
  'maxTableSyncWorkers',
  'maxCopyConnectionsPerTable',
  'invalidatedSlotBehavior',
] as const satisfies readonly (keyof DestinationPanelSchemaType)[]

/** Keeps pipeline-wide fields when the destination type changes; resets type-specific credentials. */
export const mergeFormValuesForDestinationTypeChange = (
  current: DestinationPanelSchemaType,
  defaults: DestinationPanelSchemaType
): DestinationPanelSchemaType => {
  const shared = Object.fromEntries(
    PIPELINE_CREATE_SHARED_FIELD_NAMES.map((key) => [key, current[key]])
  ) as Pick<DestinationPanelSchemaType, (typeof PIPELINE_CREATE_SHARED_FIELD_NAMES)[number]>

  return {
    ...defaults,
    ...shared,
  }
}
