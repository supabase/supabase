import { Pencil } from 'lucide-react'
import { Fragment } from 'react'
import { Button, CardContent, Input } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { CREATE_NEW_NAMESPACE } from '../DestinationPanel/DestinationForm/DestinationForm.constants'
import type { DestinationPanelSchemaType } from '../DestinationPanel/DestinationForm/DestinationForm.schema'
import {
  DUCKLAKE_MODE_CUSTOM,
  DUCKLAKE_MODE_SUPABASE,
} from '../DestinationPanel/DestinationForm/DuckLake/DuckLake.constants'
import type { PipelineCreateStepId, PipelineDestinationType } from './CreatePipelineWizard.utils'
import { PIPELINE_REGION } from './PipelineRegionField'
import { PipelineValidationAdmonition } from './PipelineValidationAdmonition'
import type { ReplicationPublication } from '@/data/replication/publications-query'
import type { ValidationFailure } from '@/data/replication/validate-destination-mutation'

const INITIAL_SYNC_LABELS: Record<DestinationPanelSchemaType['tableSyncCopyMode'], string> = {
  include_all_tables: 'All tables',
  skip_all_tables: 'No tables',
  include_tables: 'Selected tables only',
  skip_tables: 'All except selected tables',
}

const tableLabel = ({ schema, name }: { schema: string; name: string }) => `${schema}.${name}`

type ReviewRow = {
  label: string
  value: string
  description?: string
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
      label: 'Publication',
      value: values.publicationName || 'None selected',
      description: 'Tables in the selected publication will be replicated to this destination.',
    },
    {
      label: 'Publication tables',
      value:
        publication == null
          ? 'Unavailable'
          : publicationTables.length === 1
            ? '1 table'
            : `${publicationTables.length} tables`,
      description: 'Tables included in the selected publication.',
    },
    {
      label: 'Initial sync',
      value: INITIAL_SYNC_LABELS[values.tableSyncCopyMode],
      description:
        'Choose which publication tables sync their existing rows. Ongoing replication includes new changes from every publication table, even when initial sync is skipped.',
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
          value: type,
          description: 'Destination type cannot be changed after creation.',
        },
      ],
    },
    {
      title: 'Connection',
      step: 'connection',
      rows: [
        { label: 'Name', value: values.name?.trim() || 'Untitled pipeline' },
        ...getDestinationRows(type, values, namespace),
        {
          label: 'Pipeline region',
          value: PIPELINE_REGION.displayName,
          description:
            'Pipelines currently run in this region. Choose a nearby destination region where possible.',
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
                  <Input readOnly value={row.value} />
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
            />
          </Fragment>
        )
      })}
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
        label: 'Project ID',
        value: values.projectId || '—',
        description: 'The Google Cloud project ID where data will be sent',
      },
      {
        label: 'Dataset ID',
        value: values.datasetId || '—',
        description: 'The BigQuery dataset where replicated tables will be created',
      },
    ]
  }

  if (type === 'Analytics Bucket') {
    return [
      {
        label: 'Bucket',
        value: values.warehouseName || '—',
        description: 'The Analytics Bucket where data will be stored',
      },
      {
        label: 'Namespace',
        value: namespace || '—',
        description: 'The namespace within the bucket where tables will be organized',
      },
    ]
  }

  if (type === 'DuckLake') {
    if (values.ducklakeMode === DUCKLAKE_MODE_CUSTOM) {
      return [
        {
          label: 'Catalog URL',
          value: values.ducklakeCatalogUrl || '—',
          description: 'A PostgreSQL connection string for the DuckLake catalog',
        },
        {
          label: 'Data path',
          value: values.ducklakeDataPath || '—',
          description: 'An S3 path where DuckLake data files will be written',
        },
      ]
    }

    return [
      {
        label: 'Catalog project',
        value: values.ducklakeCatalogProjectRef || '—',
        description:
          "Warehouse connects to this project's Postgres instance to store the DuckLake catalog",
      },
      {
        label: 'Storage project',
        value: values.ducklakeStorageProjectRef || '—',
        description: 'The project whose object storage holds the DuckLake data files',
      },
      {
        label: 'Bucket',
        value: values.ducklakeStorageBucket || '—',
        description: 'The bucket in which DuckLake data files will be stored.',
      },
    ]
  }

  if (type === 'Snowflake') {
    return [
      {
        label: 'Account ID',
        value: values.snowflakeAccountId || '—',
        description: 'Snowflake account identifier, for example ORGNAME-ACCOUNTNAME',
      },
      {
        label: 'Database',
        value: values.snowflakeDatabase || '—',
        description: 'Snowflake database where replicated tables will be created',
      },
      {
        label: 'Schema',
        value: values.snowflakeSchema || '—',
        description: 'Snowflake schema where replicated tables will be created',
      },
    ]
  }

  if (type === 'ClickHouse') {
    return [
      {
        label: 'URL',
        value: values.clickhouseUrl || '—',
        description: 'HTTPS endpoint for your ClickHouse server, including port',
      },
      {
        label: 'Database',
        value: values.clickhouseDatabase || '—',
        description: 'The ClickHouse database where replicated tables will be created',
      },
      {
        label: 'Table engine',
        value: values.clickhouseEngine || 'replacing_merge_tree',
        description: 'Server defaults to replacing_merge_tree when unset',
      },
    ]
  }

  const _exhaustive: never = type
  return _exhaustive
}
