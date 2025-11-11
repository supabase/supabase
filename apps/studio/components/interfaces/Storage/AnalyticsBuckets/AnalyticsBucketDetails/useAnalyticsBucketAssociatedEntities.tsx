import { PermissionAction } from '@supabase/shared-types/out/constants'

import { WrapperMeta } from 'components/interfaces/Integrations/Wrappers/Wrappers.types'
import { useReplicationPipelinesQuery } from 'data/etl/pipelines-query'
import {
  ReplicationPublication,
  useReplicationPublicationsQuery,
} from 'data/etl/publications-query'
import { useReplicationSourcesQuery } from 'data/etl/sources-query'
import { useFDWDeleteMutation } from 'data/fdw/fdw-delete-mutation'
import { FDW } from 'data/fdw/fdws-query'
import { useS3AccessKeyDeleteMutation } from 'data/storage/s3-access-key-delete-mutation'
import { S3AccessKey, useStorageCredentialsQuery } from 'data/storage/s3-access-key-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  getAnalyticsBucketPublicationName,
  getAnalyticsBucketS3KeyName,
} from './AnalyticsBucketDetails.utils'
import { useAnalyticsBucketWrapperInstance } from './useAnalyticsBucketWrapperInstance'

/**
 * Returns all the data that's associated to a specified analytics bucket (e.g publications, S3 keys, etc)
 * Used for cleaning up analytics bucket after deletion
 */
export const useAnalyticsBucketAssociatedEntities = (
  { projectRef, bucketId }: { projectRef?: string; bucketId?: string },
  options: { enabled: boolean } = { enabled: true }
) => {
  const { can: canReadS3Credentials } = useAsyncCheckPermissions(
    PermissionAction.STORAGE_ADMIN_READ,
    '*'
  )

  const { data: icebergWrapper, meta: icebergWrapperMeta } = useAnalyticsBucketWrapperInstance(
    { bucketId },
    { enabled: options.enabled }
  )

  const { data: s3AccessKeys } = useStorageCredentialsQuery(
    { projectRef },
    { enabled: canReadS3Credentials && options.enabled }
  )
  const s3AccessKey = (s3AccessKeys?.data ?? []).find(
    (x) => x.description === getAnalyticsBucketS3KeyName(bucketId ?? '')
  )

  const { data: sourcesData } = useReplicationSourcesQuery(
    { projectRef },
    { enabled: options.enabled }
  )
  const sourceId = sourcesData?.sources.find((s) => s.name === projectRef)?.id

  const { data: publications = [] } = useReplicationPublicationsQuery(
    { projectRef, sourceId },
    { enabled: options.enabled }
  )
  const publication = publications.find(
    (p) => p.name === getAnalyticsBucketPublicationName(bucketId ?? '')
  )

  const { data: pipelines } = useReplicationPipelinesQuery({ projectRef })
  const pipeline = pipelines?.pipelines.find((x) => x.config.publication_name === publication?.name)

  return { icebergWrapper, icebergWrapperMeta, s3AccessKey, sourceId, publication, pipeline }
}

export const useAnalyticsBucketDeleteCleanUp = () => {
  const { mutateAsync: deleteFDW, isLoading: isDeletingWrapper } = useFDWDeleteMutation({
    // Silence default error handler toast
    onError: () => {},
  })

  const { mutateAsync: deleteS3AccessKey, isLoading: isDeletingKey } = useS3AccessKeyDeleteMutation(
    {
      // Silence default error handler toast
      onError: () => {},
    }
  )

  const isDeleting = isDeletingWrapper || isDeletingKey

  const mutateAsync = async ({
    bucketId,
    projectRef,
    connectionString,
    icebergWrapper,
    icebergWrapperMeta,
    s3AccessKey,
    publication,
  }: {
    bucketId?: string
    projectRef?: string
    connectionString?: string
    icebergWrapper?: FDW
    icebergWrapperMeta?: WrapperMeta
    s3AccessKey?: S3AccessKey
    publication?: ReplicationPublication
  }) => {
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

    if (!!publication) {
      try {
        // [TODO] Delete the publication
      } catch (error: any) {
        console.error(`Failed to delete replication publication for: ${bucketId}`, error.message)
      }
    } else {
      console.warn(`Unable to find and delete replication publication for ${bucketId}`)
    }
  }

  return { mutateAsync, isLoading: isDeleting }
}
