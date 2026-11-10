import { useParams } from 'common'
import { useRouter } from 'next/router'
import { toast } from 'sonner'

import { getPolicyBucketNames } from '@/components/interfaces/Storage/Storage.utils'
import { hasVersioningHistory } from '@/components/interfaces/Storage/StorageVersioning.constants'
import { TextConfirmModal } from '@/components/ui/TextConfirmModalWrapper'
import { useDatabasePoliciesQuery } from '@/data/database-policies/database-policies-query'
import { useDatabasePolicyDeleteMutation } from '@/data/database-policies/database-policy-delete-mutation'
import { useBucketDeleteMutation } from '@/data/storage/bucket-delete-mutation'
import { Bucket } from '@/data/storage/buckets-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

export interface DeleteBucketModalProps {
  visible: boolean
  bucket: Bucket
  onClose: () => void
}

export const DeleteBucketModal = ({ visible, bucket, onClose }: DeleteBucketModalProps) => {
  const router = useRouter()
  const { ref: projectRef, bucketId } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const { data: policies } = useDatabasePoliciesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schemas: ['storage'],
  })

  const { mutateAsync: deletePolicy } = useDatabasePolicyDeleteMutation()

  const { mutate: deleteBucket, isPending: isDeletingBucket } = useBucketDeleteMutation({
    onSuccess: async () => {
      // Close the modal and navigate away as soon as the bucket itself is deleted, so
      // policy cleanup below (which can be slow) doesn't hold the loading state or block
      // the success feedback.
      toast.success(`Successfully deleted bucket ${bucket.id}`)
      if (bucketId) {
        await router.push(`/project/${projectRef}/storage/files`)
      } else {
        onClose()
      }

      if (!project) return console.error('Project is required')

      // Clean up policies that target only the bucket that was deleted. Policies that also
      // cover other buckets (or negate the bucket condition) are left in place.
      const bucketPolicies = (policies ?? []).filter((policy) => {
        if (policy.table !== 'objects') return false

        const policyBuckets = getPolicyBucketNames(policy)
        return policyBuckets.length === 1 && policyBuckets[0] === bucket.name
      })

      if (bucketPolicies.length === 0) return

      try {
        await Promise.all(
          bucketPolicies.map((policy) =>
            deletePolicy({
              projectRef: project.ref,
              connectionString: project.connectionString,
              originalPolicy: policy,
            })
          )
        )
      } catch (error) {
        toast.success(
          `Successfully deleted bucket ${bucket.id}. However, there was a problem deleting the policies tied to the bucket. Please review them in the storage policies section`
        )
      }
    },
  })

  const onConfirmDelete = async () => {
    if (!projectRef) return console.error('Project ref is required')
    if (!bucket) return console.error('No bucket is selected')
    deleteBucket({ projectRef, id: bucket.id })
  }

  // Not gated on the feature preview: the retained data is destroyed either way, so the
  // warning has to reflect the bucket rather than what the dashboard happens to be showing.
  const isRetainingVersions = hasVersioningHistory(bucket)

  return (
    <TextConfirmModal
      visible={visible}
      size="medium"
      variant="destructive"
      title={`Delete bucket “${bucket.id}”`}
      loading={isDeletingBucket}
      confirmPlaceholder="Type bucket name"
      confirmString={bucket.id}
      confirmLabel="Delete bucket"
      onCancel={onClose}
      onConfirm={onConfirmDelete}
      alert={{
        title: 'You cannot recover this bucket once deleted',
        description: 'This action cannot be undone',
      }}
    >
      <p className="text-sm">
        Your bucket <span className="font-bold text-foreground">{bucket.id}</span> and all of its
        contents will be permanently deleted.
        {isRetainingVersions && (
          <span>
            {
              ' That includes every archived file and every retained version, which cannot be restored afterwards.'
            }
          </span>
        )}
      </p>
    </TextConfirmModal>
  )
}
