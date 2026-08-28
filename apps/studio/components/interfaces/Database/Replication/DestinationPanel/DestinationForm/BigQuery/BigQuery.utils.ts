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

export type BigQueryValidationIssue<Path extends string = string> = {
  path: Path
  message: string
}

export const BIGQUERY_SERVICE_ACCOUNT_JSON_MESSAGE = 'Service account key must be valid JSON.'

const BIGQUERY_REQUIRED_FIELDS: {
  path: Exclude<BigQueryFieldPath, 'serviceAccountKey'>
  message: string
}[] = [
  { path: 'projectId', message: 'Project ID is required.' },
  { path: 'datasetId', message: 'Dataset ID is required.' },
]

const isValidJsonString = (value: string) => {
  try {
    JSON.parse(value)
    return true
  } catch {
    return false
  }
}

export const getBigQueryValidationIssues = (
  data: Pick<DestinationPanelSchemaType, BigQueryFieldPath>,
  options: { secretsOptional?: boolean; validateJson?: boolean } = {}
): BigQueryValidationIssue<BigQueryFieldPath>[] => {
  const { secretsOptional = false, validateJson = true } = options
  const issues: BigQueryValidationIssue<BigQueryFieldPath>[] = BIGQUERY_REQUIRED_FIELDS.filter(
    ({ path }) => !data[path]?.trim().length
  ).map(({ path, message }) => ({ path, message }))

  const serviceAccountKey = data.serviceAccountKey?.trim() ?? ''

  if (!serviceAccountKey) {
    if (!secretsOptional) {
      issues.push({ path: 'serviceAccountKey', message: 'Service account key is required.' })
    }
    return issues
  }

  // JSON shape is checked on submit only. Live onChange validation would fail on every
  // keystroke while the user is still pasting or typing a key.
  if (validateJson && !isValidJsonString(serviceAccountKey)) {
    issues.push({
      path: 'serviceAccountKey',
      message: BIGQUERY_SERVICE_ACCOUNT_JSON_MESSAGE,
    })
  }

  return issues
}
