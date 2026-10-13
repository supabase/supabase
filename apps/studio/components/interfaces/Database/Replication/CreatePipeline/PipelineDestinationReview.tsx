import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useWatch, type Control } from 'react-hook-form'
import { Button } from 'ui'

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

const MaskedUrl = ({ value, label }: { value: string; label: string }) => {
  const [isVisible, setIsVisible] = useState(false)
  if (!value) return <>Not set</>
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="min-w-0 break-all">{isVisible ? value : '••••••••'}</span>
      <Button
        type="button"
        variant="text"
        size="tiny"
        aria-label={`${isVisible ? 'Hide' : 'Show'} ${label.replace(/^[A-Z][a-z]+/, (word) => word.toLowerCase())}`}
        aria-pressed={isVisible}
        icon={isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
        onClick={() => setIsVisible(!isVisible)}
      />
    </div>
  )
}

export const PipelineDestinationReview = ({
  type,
  control,
}: {
  type: DestinationType
  control: Control<DestinationPanelSchemaType>
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
  const rows: { label: string; value?: string; isMasked?: boolean }[] = []
  switch (type) {
    case 'BigQuery':
      rows.push(
        { label: BIGQUERY_PROJECT_ID_FIELD_COPY.label, value: projectId },
        { label: BIGQUERY_DATASET_ID_FIELD_COPY.label, value: datasetId }
      )
      break
    case 'DuckLake':
      if (mode === 'custom') {
        rows.push(
          { label: DUCKLAKE_CATALOG_URL_FIELD_COPY.label, value: catalogUrl, isMasked: true },
          { label: DUCKLAKE_DATA_PATH_FIELD_COPY.label, value: dataPath }
        )
      } else {
        rows.push({ label: DUCKLAKE_BUCKET_FIELD_COPY.label, value: bucket })
      }
      break
    case 'Snowflake':
      rows.push(
        { label: SNOWFLAKE_ACCOUNT_ID_FIELD_COPY.label, value: account },
        { label: SNOWFLAKE_DATABASE_FIELD_COPY.label, value: database },
        { label: SNOWFLAKE_SCHEMA_FIELD_COPY.label, value: schema }
      )
      break
    case 'ClickHouse':
      rows.push(
        { label: CLICKHOUSE_URL_FIELD_COPY.label, value: url, isMasked: true },
        { label: CLICKHOUSE_DATABASE_FIELD_COPY.label, value: clickhouseDatabase },
        {
          label: CLICKHOUSE_ENGINE_FIELD_COPY.label,
          value: engine === 'merge_tree' ? 'MergeTree' : 'ReplacingMergeTree',
        }
      )
      break
    case 'Analytics Bucket':
      rows.push(
        { label: ANALYTICS_BUCKET_BUCKET_FIELD_COPY.label, value: warehouse },
        {
          label: ANALYTICS_BUCKET_NAMESPACE_FIELD_COPY.label,
          value: namespace === CREATE_NEW_NAMESPACE ? newNamespace : namespace,
        }
      )
      break
  }
  return (
    <section aria-label="Destination review" className="space-y-4 p-5">
      <h3 className="text-sm font-medium text-foreground">Destination review</h3>
      <dl className="space-y-4 text-sm">
        {[
          { label: PIPELINE_NAME_FIELD_COPY.label, value: name },
          { label: 'Destination type', value: type },
          ...rows,
        ].map((row) => (
          <div key={row.label} className="grid gap-1 sm:grid-cols-2 sm:gap-4">
            <dt className="text-foreground-light">{row.label}</dt>
            <dd className="min-w-0 break-words text-foreground">
              {row.isMasked ? (
                <MaskedUrl key={`${type}-${row.value}`} value={row.value ?? ''} label={row.label} />
              ) : (
                row.value || 'Not set'
              )}
            </dd>
          </div>
        ))}
        <div className="grid gap-1 sm:grid-cols-2 sm:gap-4">
          <dt className="text-foreground-light">Pipeline region</dt>
          <dd>
            <PipelineRegionReadonly />
          </dd>
        </div>
      </dl>
    </section>
  )
}
