import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useFDWDeleteMutation } from 'data/fdw/fdw-delete-mutation'
import { useDeleteDestinationPipelineMutation } from 'data/replication/delete-destination-pipeline-mutation'
import { useReplicationDestinationsQuery } from 'data/replication/destinations-query'
import { useReplicationPipelinesQuery } from 'data/replication/pipelines-query'
import { useDeletePublicationMutation } from 'data/replication/publication-delete-mutation'
import { useReplicationPublicationsQuery } from 'data/replication/publications-query'
import { useReplicationSourcesQuery } from 'data/replication/sources-query'
import { useS3AccessKeyDeleteMutation } from 'data/storage/s3-access-key-delete-mutation'
import { useStorageCredentialsQuery } from 'data/storage/s3-access-key-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import {
  getAnalyticsBucketPublicationName,
  getAnalyticsBucketS3KeyName,
  getAnalyticsBucketsDestinationName,
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

  const { data: destinationsData } = useReplicationDestinationsQuery({ projectRef })
  const destinations = destinationsData?.destinations ?? []
  const destination = destinations.find(
    (x) => x.name === getAnalyticsBucketsDestinationName(bucketId ?? '')
  )

  const { data: pipelines } = useReplicationPipelinesQuery({ projectRef })
  const pipeline = pipelines?.pipelines.find((x) => x.config.publication_name === publication?.name)

  return {
    icebergWrapper,
    icebergWrapperMeta,
    s3AccessKey,
    sourceId,
    publication,
    pipeline,
    destination,
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
  const {
    icebergWrapper,
    icebergWrapperMeta,
    s3AccessKey,
    publication,
    sourceId,
    pipeline,
    destination,
  } = useAnalyticsBucketAssociatedEntities({ projectRef, bucketId: bucketId })

  // Default error handlers from all mutations will be silenced
  const { mutateAsync: deleteFDW, isPending: isDeletingWrapper } = useFDWDeleteMutation({
    onError: () => {},
  })
  const { mutateAsync: deleteS3AccessKey, isPending: isDeletingKey } = useS3AccessKeyDeleteMutation(
    { onError: () => {} }
  )
  const { mutateAsync: deletePublication, isPending: isDeletingPublication } =
    useDeletePublicationMutation({ onError: () => {} })
  const { mutateAsync: deletePipeline, isPending: isDeletingPipeline } =
    useDeleteDestinationPipelineMutation({ onError: () => {} })

  const isDeleting =
    isDeletingWrapper || isDeletingKey || isDeletingPublication || isDeletingPipeline

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

    if (!!pipeline && !!destination) {
      try {
        await deletePipeline({
          projectRef,
          destinationId: destination?.id,
          pipelineId: pipeline.id,
        })
      } catch (error: any) {
        console.error(`Failed to delete replication pipeline for: ${bucketId}`, error.message)
      }
    } else {
      console.warn(`Unable to find and delete replication pipeline for ${bucketId}`)
    }

    if (!!publication && !!sourceId) {
      try {
        await deletePublication({ projectRef, sourceId, publicationName: publication.name })
      } catch (error: any) {
        console.error(`Failed to delete replication publication for: ${bucketId}`, error.message)
      }
    } else {
      console.warn(`Unable to find and delete replication publication for ${bucketId}`)
    }
  }

  return { mutateAsync, isPending: isDeleting }
}
