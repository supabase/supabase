import { EditIcon, EyeIcon, EyeOffIcon } from 'lucide-react'
import { useState } from 'react'
import { useWatch, type Control } from 'react-hook-form'
import { Button, Input, Separator } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { DestinationLogo } from '../DestinationLogo'
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
  DUCKLAKE_CATALOG_URL_FIELD_COPY,
  DUCKLAKE_DATA_PATH_FIELD_COPY,
  PIPELINE_NAME_FIELD_COPY,
  SNOWFLAKE_ACCOUNT_ID_FIELD_COPY,
  SNOWFLAKE_DATABASE_FIELD_COPY,
  SNOWFLAKE_SCHEMA_FIELD_COPY,
} from '../DestinationPanel/DestinationForm/DestinationFormFieldCopy'
import { PipelineRegionReadonly } from '../DestinationPanel/DestinationForm/PipelineRegionField'
import type { DestinationType } from '../DestinationPanel/DestinationPanel.types'
import { PipelineConnectionReview } from './PipelineConnectionReview'

const MaskedUrl = ({ value, label }: { value: string; label: string }) => {
  const [isVisible, setIsVisible] = useState(false)
  if (!value) return <Input readOnly value="Not set" aria-label={label} />
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Input readOnly aria-label={label} value={isVisible ? value : '••••••••'} />
      <Button
        type="button"
        variant="text"
        size="tiny"
        aria-label={`${isVisible ? 'Hide' : 'Show'} ${label.replace(/^[A-Z][a-z]+/, (word) => word.toLowerCase())}`}
        aria-pressed={isVisible}
        icon={isVisible ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
        onClick={() => setIsVisible(!isVisible)}
      />
    </div>
  )
}

export const PipelineDestinationReview = ({
  type,
  control,
  onEditDestination,
  onEditConnection,
}: {
  type: DestinationType
  control: Control<DestinationPanelSchemaType>
  onEditDestination?: () => void
  onEditConnection?: () => void
}) => {
  const [
    name,
    projectId,
    datasetId,
    mode,
    catalogUrl,
    dataPath,
    bucket,
    account,
    database,
    schema,
    url,
    clickhouseDatabase,
    engine,
    warehouse,
    namespace,
    newNamespace,
  ] = useWatch({
    control,
    name: [
      'name',
      'projectId',
      'datasetId',
      'ducklakeMode',
      'ducklakeCatalogUrl',
      'ducklakeDataPath',
      'ducklakeStorageBucket',
      'snowflakeAccountId',
      'snowflakeDatabase',
      'snowflakeSchema',
      'clickhouseUrl',
      'clickhouseDatabase',
      'clickhouseEngine',
      'warehouseName',
      'namespace',
      'newNamespaceName',
    ],
  })
  const rows: { label: string; value?: string; description: string; isMasked?: boolean }[] = []
  switch (type) {
    case 'BigQuery':
      rows.push(
        { ...BIGQUERY_PROJECT_ID_FIELD_COPY, value: projectId },
        { ...BIGQUERY_DATASET_ID_FIELD_COPY, value: datasetId }
      )
      break
    case 'DuckLake':
      if (mode === 'custom') {
        rows.push(
          {
            ...DUCKLAKE_CATALOG_URL_FIELD_COPY,
            description: 'Postgres URL of the database used for the DuckLake catalog.',
            value: catalogUrl,
            isMasked: true,
          },
          { ...DUCKLAKE_DATA_PATH_FIELD_COPY, value: dataPath }
        )
      } else {
        rows.push({ ...DUCKLAKE_BUCKET_FIELD_COPY, value: bucket })
      }
      break
    case 'Snowflake':
      rows.push(
        { ...SNOWFLAKE_ACCOUNT_ID_FIELD_COPY, value: account },
        { ...SNOWFLAKE_DATABASE_FIELD_COPY, value: database },
        { ...SNOWFLAKE_SCHEMA_FIELD_COPY, value: schema }
      )
      break
    case 'ClickHouse':
      rows.push(
        { ...CLICKHOUSE_URL_FIELD_COPY, value: url, isMasked: true },
        { ...CLICKHOUSE_DATABASE_FIELD_COPY, value: clickhouseDatabase },
        {
          ...CLICKHOUSE_ENGINE_FIELD_COPY,
          value: engine === 'merge_tree' ? 'MergeTree' : 'ReplacingMergeTree',
        }
      )
      break
    case 'Analytics Bucket':
      rows.push(
        { ...ANALYTICS_BUCKET_BUCKET_FIELD_COPY, value: warehouse },
        {
          ...ANALYTICS_BUCKET_NAMESPACE_FIELD_COPY,
          value: namespace === CREATE_NEW_NAMESPACE ? newNamespace : namespace,
        }
      )
      break
  }
  return (
    <section aria-label="Destination review">
      <div className="space-y-6 p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-foreground">Destination</h3>
          {onEditDestination && (
            <Button
              type="button"
              icon={<EditIcon />}
              size="tiny"
              aria-label="Edit destination"
              onClick={onEditDestination}
            >
              Edit
            </Button>
          )}
        </div>
        <FormItemLayout
          isReactForm={false}
          layout="horizontal"
          label="Type"
          description={`Destination type cannot be changed after creation. ${type === 'Analytics Bucket' ? 'Analytics Bucket is deprecated.' : `${type} support is in public alpha.`}`}
        >
          <div className="flex h-11 min-w-0 items-center gap-2 rounded-md border bg-surface-200 px-3">
            <DestinationLogo type={type} />
            <span className="text-sm text-foreground">{type}</span>
          </div>
        </FormItemLayout>
      </div>
      <Separator />
      <div className="space-y-6 p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-foreground">Connection</h3>
          {onEditConnection && (
            <Button
              type="button"
              icon={<EditIcon />}
              size="tiny"
              aria-label="Edit connection"
              onClick={onEditConnection}
            >
              Edit
            </Button>
          )}
        </div>
        {[{ ...PIPELINE_NAME_FIELD_COPY, value: name }, ...rows].map((row) => (
          <FormItemLayout
            key={row.label}
            isReactForm={false}
            layout="horizontal"
            label={row.label}
            description={row.description}
          >
            {row.isMasked ? (
              <MaskedUrl key={`${type}-${row.value}`} value={row.value ?? ''} label={row.label} />
            ) : (
              <Input readOnly aria-label={row.label} value={row.value || 'Not set'} />
            )}
          </FormItemLayout>
        ))}
        <PipelineConnectionReview type={type} control={control} />
        <FormItemLayout
          isReactForm={false}
          layout="horizontal"
          label="Pipeline region"
          description={`All pipelines run from this region. ${type} connections originate here.`}
        >
          <PipelineRegionReadonly />
        </FormItemLayout>
      </div>
    </section>
  )
}
