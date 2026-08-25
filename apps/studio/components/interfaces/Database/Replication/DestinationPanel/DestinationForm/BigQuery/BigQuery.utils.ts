import { type DestinationPanelSchemaType } from '../DestinationForm.schema'
import type { BigQueryPartitionBy } from '@/data/replication/create-destination-pipeline-mutation'

type BigQueryFieldPath = 'projectId' | 'datasetId' | 'serviceAccountKey'

export type BigQueryPartitionKind = BigQueryPartitionBy['kind'] | 'none'

// Postgres' verbose spelling for a handful of common types, shown here as their much shorter,
// equally standard aliases so a column's type doesn't crowd out its name in a narrow picker.
const PG_TYPE_ALIASES: Record<string, string> = {
  'timestamp with time zone': 'timestamptz',
  'timestamp without time zone': 'timestamp',
  'time with time zone': 'timetz',
  'time without time zone': 'time',
  'character varying': 'varchar',
  'double precision': 'float8',
}

export const shortenPgType = (type: string) => PG_TYPE_ALIASES[type] ?? type

export const defaultPartitionByForKind = (
  kind: BigQueryPartitionKind
): BigQueryPartitionBy | undefined => {
  switch (kind) {
    case 'none':
      return undefined
    case 'time_column':
      return { kind: 'time_column', column: '', granularity: 'day' }
    case 'integer_range':
      return { kind: 'integer_range', column: '', start: 0, end: 100, interval: 10 }
    case 'ingestion_time':
      return { kind: 'ingestion_time', granularity: 'day' }
  }
}

// Parses a partition start/end/interval input, keeping the previous value for anything that
// isn't yet a finite number (e.g. while the user is still typing "-" or has cleared the field).
export const parseIntegerInput = (value: string, previous: number) => {
  const parsed = Number(value)
  return value.trim().length > 0 && Number.isFinite(parsed) ? parsed : previous
}

export type BigQueryValidationIssue = {
  path: string
  message: string
}

const BIGQUERY_REQUIRED_FIELDS: { path: BigQueryFieldPath; message: string }[] = [
  { path: 'projectId', message: 'Project ID is required' },
  { path: 'datasetId', message: 'Dataset ID is required' },
  { path: 'serviceAccountKey', message: 'Service account key is required' },
]

export const getBigQueryValidationIssues = (
  data: Pick<DestinationPanelSchemaType, BigQueryFieldPath>,
  options: { secretsOptional?: boolean } = {}
): BigQueryValidationIssue[] =>
  BIGQUERY_REQUIRED_FIELDS.filter(({ path }) => {
    if (options.secretsOptional && path === 'serviceAccountKey') return false

    return !data[path]?.trim().length
  })

// Cross-field checks for per-table partitioning/clustering, mirroring the validation etl
// applies server-side (integer-range bounds, and that a configured table sets at least one
// of partitioning/clustering) so the form surfaces the same problems before submitting.
export const getBigQueryTableOptionsValidationIssues = (
  tableOptions: DestinationPanelSchemaType['tableOptions']
): BigQueryValidationIssue[] => {
  const issues: BigQueryValidationIssue[] = []

  ;(tableOptions ?? []).forEach((option, index) => {
    if (!option.partitionBy && !(option.clusterBy && option.clusterBy.length > 0)) {
      issues.push({
        path: `tableOptions.${index}.partitionBy`,
        message: 'Set a partitioning or clustering option, or remove this table',
      })
    }

    if (option.partitionBy?.kind === 'integer_range') {
      const { start, end, interval } = option.partitionBy

      if (start >= end) {
        issues.push({
          path: `tableOptions.${index}.partitionBy.end`,
          message: 'End must be greater than start',
        })
      }

      if (interval <= 0) {
        issues.push({
          path: `tableOptions.${index}.partitionBy.interval`,
          message: 'Interval must be greater than 0',
        })
      }
    }
  })

  return issues
}
