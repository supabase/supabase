import { type DestinationPanelSchemaType } from '../DestinationForm.schema'

type BigQueryFieldPath = 'projectId' | 'datasetId' | 'serviceAccountKey'

export type BigQueryValidationIssue = {
  path: BigQueryFieldPath
  message: string
}

const BIGQUERY_REQUIRED_FIELDS: {
  path: Exclude<BigQueryFieldPath, 'serviceAccountKey'>
  message: string
}[] = [
  { path: 'projectId', message: 'Project ID is required' },
  { path: 'datasetId', message: 'Dataset ID is required' },
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
  options: { secretsOptional?: boolean } = {}
): BigQueryValidationIssue[] => {
  const issues: BigQueryValidationIssue[] = BIGQUERY_REQUIRED_FIELDS.filter(
    ({ path }) => !data[path]?.trim().length
  ).map(({ path, message }) => ({ path, message }))

  const serviceAccountKey = data.serviceAccountKey?.trim() ?? ''

  if (!serviceAccountKey) {
    if (!options.secretsOptional) {
      issues.push({ path: 'serviceAccountKey', message: 'Service account key is required' })
    }
    return issues
  }

  if (!isValidJsonString(serviceAccountKey)) {
    issues.push({
      path: 'serviceAccountKey',
      message: 'Service account key must be valid JSON',
    })
  }

  return issues
}
