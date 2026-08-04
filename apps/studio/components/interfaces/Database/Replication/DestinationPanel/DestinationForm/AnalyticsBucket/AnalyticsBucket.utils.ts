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

type AnalyticsBucketValidationOptions = {
  secretsOptional?: boolean
  storedS3AccessKeyId?: string
}

// Fields that are always required regardless of the namespace / access key selections.
const ANALYTICS_BUCKET_REQUIRED_FIELDS: AnalyticsBucketValidationIssue[] = [
  { path: 'warehouseName', message: 'Bucket is required' },
  { path: 's3Region', message: 'S3 region is required' },
  { path: 's3AccessKeyId', message: 'S3 access key ID is required' },
]

export const getAnalyticsBucketValidationIssues = (
  data: Pick<DestinationPanelSchemaType, AnalyticsBucketFieldPath>,
  options: AnalyticsBucketValidationOptions = {}
): AnalyticsBucketValidationIssue[] => {
  const requiredFields = options.secretsOptional
    ? ANALYTICS_BUCKET_REQUIRED_FIELDS.filter(({ path }) => path !== 's3AccessKeyId')
    : ANALYTICS_BUCKET_REQUIRED_FIELDS
  const issues = requiredFields.filter(({ path }) => !data[path]?.trim().length)

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

  if (
    options.secretsOptional &&
    data.s3SecretAccessKey?.trim().length &&
    !data.s3AccessKeyId?.trim().length
  ) {
    issues.push({ path: 's3AccessKeyId', message: 'S3 access key ID is required' })
  }

  const currentS3AccessKeyId = data.s3AccessKeyId?.trim()
  const storedS3AccessKeyId = options.storedS3AccessKeyId?.trim()
  const hasChangedStoredS3AccessKey =
    options.secretsOptional &&
    !!currentS3AccessKeyId &&
    currentS3AccessKeyId !== storedS3AccessKeyId

  // Creating a new key generates the secret later, so only require it for existing keys.
  if (
    data.s3AccessKeyId !== CREATE_NEW_KEY &&
    (!options.secretsOptional || hasChangedStoredS3AccessKey) &&
    !data.s3SecretAccessKey?.trim().length
  ) {
    issues.push({ path: 's3SecretAccessKey', message: 'S3 secret access key is required' })
  }

  return issues
}
