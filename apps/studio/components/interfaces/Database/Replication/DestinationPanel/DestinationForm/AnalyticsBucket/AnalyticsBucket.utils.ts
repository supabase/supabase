import { CREATE_NEW_KEY, CREATE_NEW_NAMESPACE } from '../DestinationForm.constants'
import { type DestinationPanelSchemaType } from '../DestinationForm.schema'

type AnalyticsBucketFieldPath =
  | 'warehouseName'
  | 'namespace'
  | 'newNamespaceName'
  | 's3Region'
  | 's3AccessKeyId'
  | 's3SecretAccessKey'

export type AnalyticsBucketValidationIssue = {
  path: AnalyticsBucketFieldPath
  message: string
}

// Fields that are always required regardless of the namespace / access key selections.
const ANALYTICS_BUCKET_REQUIRED_FIELDS: AnalyticsBucketValidationIssue[] = [
  { path: 'warehouseName', message: 'Bucket is required' },
  { path: 's3Region', message: 'S3 Region is required' },
  { path: 's3AccessKeyId', message: 'S3 Access Key ID is required' },
]

export const getAnalyticsBucketValidationIssues = (
  data: Pick<DestinationPanelSchemaType, AnalyticsBucketFieldPath>
): AnalyticsBucketValidationIssue[] => {
  const issues = ANALYTICS_BUCKET_REQUIRED_FIELDS.filter(({ path }) => !data[path]?.trim().length)

  const isCreatingNewNamespace = data.namespace === CREATE_NEW_NAMESPACE
  const hasValidNamespace =
    (data.namespace?.trim().length && !isCreatingNewNamespace) ||
    (isCreatingNewNamespace && data.newNamespaceName?.trim().length)

  if (!hasValidNamespace) {
    issues.push(
      isCreatingNewNamespace
        ? { path: 'newNamespaceName', message: 'Namespace name is required' }
        : { path: 'namespace', message: 'Namespace is required' }
    )
  }

  // Creating a new key generates the secret later, so only require it for existing keys.
  if (data.s3AccessKeyId !== CREATE_NEW_KEY && !data.s3SecretAccessKey?.trim().length) {
    issues.push({ path: 's3SecretAccessKey', message: 'S3 Secret Access Key is required' })
  }

  return issues
}
