import { getBigQueryValidationIssues } from '../DestinationPanel/DestinationForm/BigQuery/BigQuery.utils'
import { getClickHouseValidationIssues } from '../DestinationPanel/DestinationForm/ClickHouse/ClickHouse.utils'
import {
  START_PIPELINE_ANYWAY_LABEL,
  START_PIPELINE_LABEL,
} from '../DestinationPanel/DestinationForm/DestinationForm.constants'
import type { DestinationPanelSchemaType } from '../DestinationPanel/DestinationForm/DestinationForm.schema'
import { pruneStaleSelectedTableIds } from '../DestinationPanel/DestinationForm/DestinationForm.utils'
import { getDucklakeValidationIssues } from '../DestinationPanel/DestinationForm/DuckLake/DuckLake.utils'
import { getSnowflakeValidationIssues } from '../DestinationPanel/DestinationForm/Snowflake/Snowflake.utils'
import type { DestinationType } from '../DestinationPanel/DestinationPanel.types'
import type { ReplicationPublicationData } from '@/data/replication/publication-query'
import { DOCS_URL } from '@/lib/constants'

export const PIPELINE_CREATE_DOCS_URL = `${DOCS_URL}/guides/database/replication#pipelines`

export const PIPELINE_PUBLICATION_DOCS_URL = `${DOCS_URL}/guides/database/replication/pipelines#step-1-create-a-postgres-publication`

const DESTINATION_SETUP_DOCS_PATHS: Partial<Record<DestinationType, string>> = {
  BigQuery: '/guides/database/replication/pipelines/bigquery#configure-bigquery-as-a-destination',
  ClickHouse:
    '/guides/database/replication/pipelines/clickhouse#configure-clickhouse-as-a-destination',
  DuckLake: '/guides/database/replication/pipelines/ducklake#choose-a-configuration-mode',
  Snowflake: '/guides/database/replication/pipelines/snowflake#prepare-snowflake-resources',
}

export const getDestinationSetupDocsUrl = (destinationType: DestinationType) =>
  `${DOCS_URL}${
    DESTINATION_SETUP_DOCS_PATHS[destinationType] ??
    '/guides/database/replication/pipelines#step-3-configure-a-destination'
  }`

export type PipelineDestinationType = Exclude<DestinationType, 'Analytics Bucket'>

export const PIPELINE_DESTINATION_TYPES: PipelineDestinationType[] = [
  'BigQuery',
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
    description: 'Check these details, then start the pipeline.',
  },
] as const

export type PipelineCreateStepId = (typeof PIPELINE_CREATE_STEPS)[number]['id']

export {
  START_PIPELINE_ANYWAY_LABEL,
  START_PIPELINE_LABEL,
} from '../DestinationPanel/DestinationForm/DestinationForm.constants'

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
  const path = `/project/${projectRef}/database/pipelines/new`
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
    return START_PIPELINE_ANYWAY_LABEL
  }
  return START_PIPELINE_LABEL
}

export const isCreatePipelineSubmitDisabled = ({
  isSaving,
  isSuccessPublications,
  isSelectedPublicationMissing,
  hasNoAvailableDestinations,
  isConnectionVerified,
  hasValidData,
}: {
  isSaving: boolean
  isSuccessPublications: boolean
  isSelectedPublicationMissing: boolean
  hasNoAvailableDestinations: boolean
  isConnectionVerified: boolean
  hasValidData: boolean
}) =>
  isSaving ||
  !isSuccessPublications ||
  isSelectedPublicationMissing ||
  hasNoAvailableDestinations ||
  !isConnectionVerified ||
  !hasValidData

export const getAccessiblePipelineCreateStep = ({
  requestedStep,
  hasDestination,
  isConnectionVerified,
  hasValidData,
}: {
  requestedStep: PipelineCreateStepId
  hasDestination: boolean
  isConnectionVerified: boolean
  hasValidData: boolean
}): PipelineCreateStepId => {
  if (requestedStep === 'destination' || !hasDestination) return 'destination'
  if (requestedStep === 'connection' || !isConnectionVerified) return 'connection'
  if (requestedStep === 'data' || !hasValidData) return 'data'
  return 'review'
}

export const isCreatePipelineNextDisabled = ({
  step,
  hasDestination,
  hasPublicationName,
  isPublicationReady,
  isSelectedPublicationMissing,
}: {
  step: PipelineCreateStepId
  hasDestination: boolean
  hasPublicationName: boolean
  isPublicationReady: boolean
  isSelectedPublicationMissing: boolean
}) => {
  if (step === 'destination') return !hasDestination

  if (step === 'data' && hasPublicationName) {
    return !isPublicationReady || isSelectedPublicationMissing
  }

  return false
}

export const hasValidConnection = ({
  type,
  data,
}: {
  type: PipelineDestinationType
  data: DestinationPanelSchemaType
}): boolean => {
  if (!data.name?.trim()) return false

  return getPipelineCreateConnectionValidationIssues({ type, data }).length === 0
}

export const getPipelineCreateConnectionValidationIssues = ({
  type,
  data,
  validateBigQueryJson = true,
}: {
  type: PipelineDestinationType
  data: DestinationPanelSchemaType
  validateBigQueryJson?: boolean
}) => {
  if (type === 'BigQuery') {
    return getBigQueryValidationIssues(data, { validateJson: validateBigQueryJson })
  }
  if (type === 'DuckLake') return getDucklakeValidationIssues(data)
  if (type === 'Snowflake') return getSnowflakeValidationIssues(data)
  if (type === 'ClickHouse') return getClickHouseValidationIssues(data)

  return []
}

export const hasValidDataStep = ({
  publicationName,
  tableSyncCopyMode,
  tableSyncCopyTableIds,
  publicationNames,
  publication,
}: {
  publicationName: string
  tableSyncCopyMode: DestinationPanelSchemaType['tableSyncCopyMode']
  tableSyncCopyTableIds: string[]
  publicationNames: string[]
  publication?: ReplicationPublicationData
}): boolean => {
  if (!publicationName) return false
  if (!publicationNames.includes(publicationName)) return false
  if (!publication || publication.name !== publicationName) return false

  const selectedTableIds = pruneStaleSelectedTableIds({
    mode: tableSyncCopyMode,
    selectedTableIds: tableSyncCopyTableIds,
    publication,
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
