import { Pencil } from 'lucide-react'
import { Fragment, type ReactNode } from 'react'
import { Button, CardContent, Input } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { DestinationTypeReadonly } from '../DestinationIcon'
import { CREATE_NEW_NAMESPACE } from '../DestinationPanel/DestinationForm/DestinationForm.constants'
import type { DestinationPanelSchemaType } from '../DestinationPanel/DestinationForm/DestinationForm.schema'
import {
  ANALYTICS_BUCKET_BUCKET_FIELD_COPY,
  ANALYTICS_BUCKET_NAMESPACE_FIELD_COPY,
  BIGQUERY_DATASET_ID_FIELD_COPY,
  BIGQUERY_PROJECT_ID_FIELD_COPY,
  CLICKHOUSE_DATABASE_FIELD_COPY,
  CLICKHOUSE_ENGINE_FIELD_COPY,
  CLICKHOUSE_URL_FIELD_COPY,
  DUCKLAKE_BUCKET_FIELD_COPY,
  DUCKLAKE_CATALOG_PROJECT_FIELD_COPY,
  DUCKLAKE_CATALOG_URL_FIELD_COPY,
  DUCKLAKE_DATA_PATH_FIELD_COPY,
  DUCKLAKE_STORAGE_PROJECT_FIELD_COPY,
  getDestinationTypeCreateDescription,
  INITIAL_SYNC_FIELD_COPY,
  INITIAL_SYNC_LABELS,
  PIPELINE_NAME_FIELD_COPY,
  PUBLICATION_FIELD_COPY,
  SNOWFLAKE_ACCOUNT_ID_FIELD_COPY,
  SNOWFLAKE_DATABASE_FIELD_COPY,
  SNOWFLAKE_SCHEMA_FIELD_COPY,
} from '../DestinationPanel/DestinationForm/DestinationFormFieldCopy'
import { DUCKLAKE_MODE_CUSTOM } from '../DestinationPanel/DestinationForm/DuckLake/DuckLake.constants'
import {
  getPipelineRegionDescription,
  PipelineRegionReadonly,
} from '../DestinationPanel/DestinationForm/PipelineRegionField'
import type { PipelineCreateStepId, PipelineDestinationType } from './CreatePipelineWizard.utils'
import { PipelineCostEstimate } from './PipelineCostEstimate'
import {
  CONNECTION_VALIDATION_HINT,
  DATA_VALIDATION_HINT,
  PipelineValidationAdmonition,
  SANDWICHED_ADMONITION_CLASS,
} from './PipelineValidationAdmonition'
import type { TableSyncCopyConfig } from '@/components/interfaces/Database/Replication/TableSyncCopy.utils'
import type { ReplicationCostEstimateData } from '@/data/replication/cost-estimate-query'
import type { ReplicationPublication } from '@/data/replication/publications-query'
import type { ValidationFailure } from '@/data/replication/validate-destination-mutation'

const tableLabel = ({ schema, name }: { schema: string; name: string }) => `${schema}.${name}`

type ReviewRow = {
  label: string
  value?: string
  description?: string
  content?: ReactNode
}

type ReviewSection = {
  title: string
  step?: PipelineCreateStepId
  rows: ReviewRow[]
}

export const PipelineReviewSummary = ({
  type,
  values,
  publications,
  connectionFailures = [],
  dataFailures = [],
  editDisabled = false,
  validationScrollRef,
  costEstimate,
  isCostEstimateLoading = false,
  isCostEstimateError = false,
  tableSyncCopy,
  onGoToStep,
}: {
  type: PipelineDestinationType
  values: DestinationPanelSchemaType
  publications: ReplicationPublication[]
  connectionFailures?: ValidationFailure[]
  dataFailures?: ValidationFailure[]
  editDisabled?: boolean
  validationScrollRef?: React.RefObject<React.ComponentRef<
    typeof PipelineValidationAdmonition
  > | null>
  costEstimate?: ReplicationCostEstimateData
  isCostEstimateLoading?: boolean
  isCostEstimateError?: boolean
  tableSyncCopy?: TableSyncCopyConfig
  onGoToStep: (step: PipelineCreateStepId) => void
}) => {
  const publication = publications.find(({ name }) => name === values.publicationName)
  const publicationTables = publication?.tables ?? []
  const selectedTables = values.tableSyncCopyTableIds
    .map((id) => publicationTables.find((table) => String(table.id) === id))
    .filter((table): table is ReplicationPublication['tables'][number] => table != null)
    .map(tableLabel)

  const namespace =
    values.namespace === CREATE_NEW_NAMESPACE ? values.newNamespaceName : values.namespace

  const dataRows: ReviewRow[] = [
    {
      label: PUBLICATION_FIELD_COPY.label,
      value: values.publicationName || 'None selected',
      description: PUBLICATION_FIELD_COPY.description,
    },
    {
      label: 'Publication tables',
      value:
        publication == null
          ? 'Unavailable'
          : publicationTables.length === 1
            ? '1 table'
            : `${publicationTables.length} tables`,
    },
    {
      label: INITIAL_SYNC_FIELD_COPY.label,
      value: INITIAL_SYNC_LABELS[values.tableSyncCopyMode],
      description: INITIAL_SYNC_FIELD_COPY.description,
    },
  ]

  if (
    (values.tableSyncCopyMode === 'include_tables' || values.tableSyncCopyMode === 'skip_tables') &&
    selectedTables.length > 0
  ) {
    dataRows.push({
      label:
        values.tableSyncCopyMode === 'include_tables' ? 'Tables to include' : 'Tables to exclude',
      value: selectedTables.join(', '),
    })
  }

  const sections: ReviewSection[] = [
    {
      title: 'Destination',
      step: 'destination',
      rows: [
        {
          label: 'Type',
          description: getDestinationTypeCreateDescription(type),
          content: <DestinationTypeReadonly type={type} />,
        },
      ],
    },
    {
      title: 'Connection',
      step: 'connection',
      rows: [
        {
          label: PIPELINE_NAME_FIELD_COPY.label,
          value: values.name?.trim() || 'Untitled pipeline',
          description: PIPELINE_NAME_FIELD_COPY.description,
        },
        ...getDestinationRows(type, values, namespace),
        {
          label: 'Pipeline region',
          description: getPipelineRegionDescription(type),
          content: <PipelineRegionReadonly />,
        },
      ],
    },
    {
      title: 'Data',
      step: 'data',
      rows: dataRows,
    },
  ]

  const scrollTargetStep: PipelineCreateStepId | null =
    connectionFailures.length > 0 ? 'connection' : dataFailures.length > 0 ? 'data' : null
  const failures = [...connectionFailures, ...dataFailures]
  const criticalCount = failures.filter(({ failure_type }) => failure_type === 'critical').length
  const warningCount = failures.filter(({ failure_type }) => failure_type === 'warning').length

  return (
    <>
      {sections.map((section) => {
        const failures =
          section.step === 'connection'
            ? connectionFailures
            : section.step === 'data'
              ? dataFailures
              : []

        return (
          <Fragment key={section.title}>
            <CardContent className="space-y-6">
              <header className="flex items-center justify-between gap-3">
                <h3 className="text-sm text-foreground">{section.title}</h3>
                {section.step ? (
                  <Button
                    type="button"
                    variant="default"
                    size="tiny"
                    icon={<Pencil size={14} />}
                    aria-label={`Edit ${section.title.toLowerCase()}`}
                    onClick={() => onGoToStep(section.step!)}
                    disabled={editDisabled}
                  >
                    Edit
                  </Button>
                ) : null}
              </header>
              {section.rows.map((row) => (
                <FormItemLayout
                  key={row.label}
                  isReactForm={false}
                  layout="horizontal"
                  label={row.label}
                  description={row.description}
                >
                  {row.content ?? <Input readOnly value={row.value ?? ''} />}
                </FormItemLayout>
              ))}
            </CardContent>
            <PipelineValidationAdmonition
              ref={
                validationScrollRef && section.step === scrollTargetStep
                  ? validationScrollRef
                  : undefined
              }
              failures={failures}
              hint={
                section.step === 'connection'
                  ? CONNECTION_VALIDATION_HINT
                  : section.step === 'data'
                    ? DATA_VALIDATION_HINT
                    : undefined
              }
            />
          </Fragment>
        )
      })}
      <PipelineCostEstimate
        estimate={costEstimate}
        isLoading={isCostEstimateLoading}
        isError={isCostEstimateError}
        publicationTables={publicationTables}
        tableSyncCopy={tableSyncCopy}
      />
      {(criticalCount > 0 || warningCount > 0) && (
        <Admonition
          type={criticalCount > 0 ? 'danger' : 'warning'}
          description={
            criticalCount > 0
              ? `${criticalCount} ${criticalCount === 1 ? 'issue must' : 'issues must'} be resolved above before you can start the pipeline.`
              : `Review the ${warningCount === 1 ? 'warning' : `${warningCount} warnings`} above before starting the pipeline.`
          }
          className={SANDWICHED_ADMONITION_CLASS}
        />
      )}
    </>
  )
}

const getDestinationRows = (
  type: PipelineDestinationType,
  values: DestinationPanelSchemaType,
  namespace?: string
): ReviewRow[] => {
  if (type === 'BigQuery') {
    return [
      {
        label: BIGQUERY_PROJECT_ID_FIELD_COPY.label,
        value: values.projectId || '—',
        description: BIGQUERY_PROJECT_ID_FIELD_COPY.description,
      },
      {
        label: BIGQUERY_DATASET_ID_FIELD_COPY.label,
        value: values.datasetId || '—',
        description: BIGQUERY_DATASET_ID_FIELD_COPY.description,
      },
    ]
  }

  if (type === 'Analytics Bucket') {
    return [
      {
        label: ANALYTICS_BUCKET_BUCKET_FIELD_COPY.label,
        value: values.warehouseName || '—',
        description: ANALYTICS_BUCKET_BUCKET_FIELD_COPY.description,
      },
      {
        label: ANALYTICS_BUCKET_NAMESPACE_FIELD_COPY.label,
        value: namespace || '—',
        description: ANALYTICS_BUCKET_NAMESPACE_FIELD_COPY.description,
      },
    ]
  }

  if (type === 'DuckLake') {
    if (values.ducklakeMode === DUCKLAKE_MODE_CUSTOM) {
      return [
        {
          label: DUCKLAKE_CATALOG_URL_FIELD_COPY.label,
          value: values.ducklakeCatalogUrl || '—',
          description: DUCKLAKE_CATALOG_URL_FIELD_COPY.createDescription,
        },
        {
          label: DUCKLAKE_DATA_PATH_FIELD_COPY.label,
          value: values.ducklakeDataPath || '—',
          description: DUCKLAKE_DATA_PATH_FIELD_COPY.description,
        },
      ]
    }

    return [
      {
        label: DUCKLAKE_CATALOG_PROJECT_FIELD_COPY.label,
        value: values.ducklakeCatalogProjectRef || '—',
        description: DUCKLAKE_CATALOG_PROJECT_FIELD_COPY.description,
      },
      {
        label: DUCKLAKE_STORAGE_PROJECT_FIELD_COPY.label,
        value: values.ducklakeStorageProjectRef || '—',
        description: DUCKLAKE_STORAGE_PROJECT_FIELD_COPY.description,
      },
      {
        label: DUCKLAKE_BUCKET_FIELD_COPY.label,
        value: values.ducklakeStorageBucket || '—',
        description: DUCKLAKE_BUCKET_FIELD_COPY.description,
      },
    ]
  }

  if (type === 'Snowflake') {
    return [
      {
        label: SNOWFLAKE_ACCOUNT_ID_FIELD_COPY.label,
        value: values.snowflakeAccountId || '—',
        description: SNOWFLAKE_ACCOUNT_ID_FIELD_COPY.description,
      },
      {
        label: SNOWFLAKE_DATABASE_FIELD_COPY.label,
        value: values.snowflakeDatabase || '—',
        description: SNOWFLAKE_DATABASE_FIELD_COPY.description,
      },
      {
        label: SNOWFLAKE_SCHEMA_FIELD_COPY.label,
        value: values.snowflakeSchema || '—',
        description: SNOWFLAKE_SCHEMA_FIELD_COPY.description,
      },
    ]
  }

  if (type === 'ClickHouse') {
    return [
      {
        label: CLICKHOUSE_URL_FIELD_COPY.label,
        value: values.clickhouseUrl || '—',
        description: CLICKHOUSE_URL_FIELD_COPY.description,
      },
      {
        label: CLICKHOUSE_DATABASE_FIELD_COPY.label,
        value: values.clickhouseDatabase || '—',
        description: CLICKHOUSE_DATABASE_FIELD_COPY.description,
      },
      {
        label: CLICKHOUSE_ENGINE_FIELD_COPY.label,
        value: values.clickhouseEngine || 'replacing_merge_tree',
        description: CLICKHOUSE_ENGINE_FIELD_COPY.description,
      },
    ]
  }

  const _exhaustive: never = type
  return _exhaustive
}
