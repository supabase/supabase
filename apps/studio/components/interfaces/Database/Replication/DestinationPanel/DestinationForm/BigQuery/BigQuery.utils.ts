import { type DestinationPanelSchemaType } from '../DestinationForm.schema'

type BigQueryFieldPath = 'projectId' | 'datasetId' | 'serviceAccountKey'

export type BigQueryValidationIssue = {
  path: BigQueryFieldPath
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
