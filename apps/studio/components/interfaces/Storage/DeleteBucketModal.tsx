import { useRouter } from 'next/router'
import { toast } from 'sonner'

import { useParams } from 'common'
import { TextConfirmModal } from 'components/ui/TextConfirmModalWrapper'
import { useDatabasePoliciesQuery } from 'data/database-policies/database-policies-query'
import { useDatabasePolicyDeleteMutation } from 'data/database-policies/database-policy-delete-mutation'
import { useBucketDeleteMutation } from 'data/storage/bucket-delete-mutation'
import { Bucket } from 'data/storage/buckets-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { extractBucketNameFromDefinition } from './Storage.utils'

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
    schema: 'storage',
  })

  const { mutateAsync: deletePolicy, isPending: isDeletingPolicies } =
    useDatabasePolicyDeleteMutation()

  const { mutate: deleteBucket, isPending: isDeletingBucket } = useBucketDeleteMutation({
    onSuccess: async () => {
      if (!project) return console.error('Project is required')

      // Clean up policies from the corresponding bucket that was deleted
      const bucketPolicies = (policies ?? []).filter((policy) => {
        if (policy.table !== 'objects') return false

        const policyBucket = extractBucketNameFromDefinition(policy.definition ?? policy.check)
        return policyBucket === bucket.name
      })

      try {
        await Promise.all(
          bucketPolicies.map((policy) =>
            deletePolicy({
              projectRef: project?.ref,
              connectionString: project?.connectionString,
              originalPolicy: policy,
            })
          )
        )

        toast.success(`Successfully deleted bucket ${bucket.id}`)
        if (!!bucketId) router.push(`/project/${projectRef}/storage/files`)
        onClose()
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

  return (
    <TextConfirmModal
      visible={visible}
      size="medium"
      variant="destructive"
      title={`Delete bucket “${bucket.id}”`}
      loading={isDeletingBucket || isDeletingPolicies}
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
      </p>
    </TextConfirmModal>
  )
}
