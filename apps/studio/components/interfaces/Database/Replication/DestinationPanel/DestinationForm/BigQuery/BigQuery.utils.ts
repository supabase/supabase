import { type DestinationPanelSchemaType } from '../DestinationForm.schema'

type BigQueryFieldPath = 'projectId' | 'datasetId' | 'serviceAccountKey'

export type BigQueryValidationIssue = {
  path: BigQueryFieldPath
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
): BigQueryValidationIssue[] => {
  const { secretsOptional = false, validateJson = true } = options
  const issues: BigQueryValidationIssue[] = BIGQUERY_REQUIRED_FIELDS.filter(
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
