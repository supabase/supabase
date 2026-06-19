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

export const getAnalyticsBucketValidationIssues = (
  data: Pick<DestinationPanelSchemaType, AnalyticsBucketFieldPath>
): AnalyticsBucketValidationIssue[] => {
  const issues: AnalyticsBucketValidationIssue[] = []

  if (!data.warehouseName?.length) {
    issues.push({ path: 'warehouseName', message: 'Bucket is required' })
  }

  const isCreatingNewNamespace = data.namespace === CREATE_NEW_NAMESPACE
  const hasValidNamespace =
    (data.namespace?.length && !isCreatingNewNamespace) ||
    (isCreatingNewNamespace && data.newNamespaceName?.length)

  if (!hasValidNamespace) {
    issues.push(
      isCreatingNewNamespace
        ? { path: 'newNamespaceName', message: 'Namespace name is required' }
        : { path: 'namespace', message: 'Namespace is required' }
    )
  }

  if (!data.s3Region?.length) {
    issues.push({ path: 's3Region', message: 'S3 Region is required' })
  }

  if (!data.s3AccessKeyId?.length) {
    issues.push({ path: 's3AccessKeyId', message: 'S3 Access Key ID is required' })
  }

  // Creating a new key generates the secret later, so only require it for existing keys.
  if (data.s3AccessKeyId !== CREATE_NEW_KEY && !data.s3SecretAccessKey?.length) {
    issues.push({ path: 's3SecretAccessKey', message: 'S3 Secret Access Key is required' })
  }

  return issues
}
