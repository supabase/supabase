import { getAnalyticsBucketS3KeyName } from './AnalyticsBucketDetails.utils'
import { useAnalyticsBucketWrapperInstance } from './useAnalyticsBucketWrapperInstance'
import { useFDWDeleteMutation } from '@/data/fdw/fdw-delete-mutation'
import { useS3AccessKeyDeleteMutation } from '@/data/storage/s3-access-key-delete-mutation'
import { useStorageCredentialsQuery } from '@/data/storage/s3-access-key-query'
import { FGA_PERMISSIONS, useAsyncCheckPermissionsV2 } from '@/hooks/misc/useCheckPermissionsV2'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

/**
 * Returns the foreign data wrapper and S3 key associated with an analytics bucket.
 * Used for cleaning up those resources after bucket deletion.
 */
export const useAnalyticsBucketAssociatedEntities = (
  { projectRef, bucketId }: { projectRef?: string; bucketId?: string },
  options: { enabled: boolean } = { enabled: true }
) => {
  const { can: canReadS3Credentials } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.STORAGE_CONFIG_READ
  )

  const {
    data: icebergWrapper,
    meta: icebergWrapperMeta,
    isLoading: isLoadingWrapperInstance,
  } = useAnalyticsBucketWrapperInstance({ bucketId }, { enabled: options.enabled })

  const { data: s3AccessKeys } = useStorageCredentialsQuery(
    { projectRef },
    { enabled: canReadS3Credentials && options.enabled }
  )
  const s3AccessKey = (s3AccessKeys?.data ?? []).find(
    (x) => x.description === getAnalyticsBucketS3KeyName(bucketId ?? '')
  )

  return {
    icebergWrapper,
    icebergWrapperMeta,
    s3AccessKey,
    isLoadingWrapperInstance,
  }
}

export const useAnalyticsBucketDeleteCleanUp = ({
  projectRef,
  bucketId,
}: {
  projectRef?: string
  bucketId?: string
}) => {
  const { data: project } = useSelectedProjectQuery()
  const { icebergWrapper, icebergWrapperMeta, s3AccessKey } = useAnalyticsBucketAssociatedEntities({
    projectRef,
    bucketId,
  })

  // Default error handlers from all mutations will be silenced
  const { mutateAsync: deleteFDW, isPending: isDeletingWrapper } = useFDWDeleteMutation({
    onError: () => {},
  })
  const { mutateAsync: deleteS3AccessKey, isPending: isDeletingKey } = useS3AccessKeyDeleteMutation(
    { onError: () => {} }
  )
  const isDeleting = isDeletingWrapper || isDeletingKey

  const mutateAsync = async () => {
    const connectionString = project?.connectionString

    if (!!icebergWrapper && !!icebergWrapperMeta) {
      try {
        await deleteFDW({
          projectRef,
          connectionString,
          wrapper: icebergWrapper,
          wrapperMeta: icebergWrapperMeta,
        })
      } catch (error: any) {
        console.error(`Failed to delete iceberg wrapper for ${bucketId}:`, error.message)
      }
    } else {
      console.warn(`Unable to find and delete iceberg wrapper for ${bucketId}`)
    }

    if (!!s3AccessKey) {
      try {
        await deleteS3AccessKey({ projectRef, id: s3AccessKey.id })
      } catch (error: any) {
        console.error(`Failed to delete S3 access key for: ${bucketId}`, error.message)
      }
    } else {
      console.warn(`Unable to find and delete corresponding S3 access key for ${bucketId}`)
    }
  }

  return { mutateAsync, isPending: isDeleting }
}
