import { useParams } from 'common'
import { get as _get, find } from 'lodash'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import TextConfirmModal from 'components/ui/Modals/TextConfirmModal'
import { useDatabasePoliciesQuery } from 'data/database-policies/database-policies-query'
import { useDatabasePolicyDeleteMutation } from 'data/database-policies/database-policy-delete-mutation'
import { useBucketDeleteMutation } from 'data/storage/bucket-delete-mutation'
import { Bucket, useBucketsQuery } from 'data/storage/buckets-query'
import { formatPoliciesForStorage } from './Storage.utils'

export interface DeleteBucketModalProps {
  visible: boolean
  bucket?: Bucket
  onClose: () => void
}

const DeleteBucketModal = ({ visible = false, bucket, onClose }: DeleteBucketModalProps) => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const { project } = useProjectContext()

  const { data } = useBucketsQuery({ projectRef })
  const { data: policies } = useDatabasePoliciesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: 'storage',
  })
  const { mutateAsync: deletePolicy } = useDatabasePolicyDeleteMutation()

  const { mutate: deleteBucket, isLoading: isDeleting } = useBucketDeleteMutation({
    onSuccess: async () => {
      if (!project) return console.error('Project is required')

      // Clean up policies from the corresponding bucket that was deleted
      const storageObjectsPolicies = (policies ?? []).filter((policy) => policy.table === 'objects')
      const formattedStorageObjectPolicies = formatPoliciesForStorage(
        buckets,
        storageObjectsPolicies
      )
      const bucketPolicies = _get(
        find(formattedStorageObjectPolicies, { name: bucket!.name }),
        ['policies'],
        []
      )
      await Promise.all(
        bucketPolicies.map((policy: any) =>
          deletePolicy({
            projectRef: project?.ref,
            connectionString: project?.connectionString,
            id: policy.id,
          })
        )
      )

      toast.success(`Successfully deleted bucket ${bucket!.name}`)
      router.push(`/project/${projectRef}/storage/buckets`)
      onClose()
    },
  })

  const buckets = data ?? []

  const onDeleteBucket = async () => {
    if (!projectRef) return console.error('Project ref is required')
    if (!bucket) return console.error('No bucket is selected')
    deleteBucket({ projectRef, id: bucket.id })
  }

  return (
    <TextConfirmModal
      visible={visible}
      title={`Confirm deletion of ${bucket?.name}`}
      confirmPlaceholder="Type in name of bucket"
      onConfirm={onDeleteBucket}
      onCancel={onClose}
      confirmString={bucket?.name ?? ''}
      loading={isDeleting}
      text={
        <>
          Your bucket <span className="font-bold">{bucket?.name}</span> and all its contents will be
          permanently deleted.
        </>
      }
      alert="You cannot recover this bucket once it is deleted."
      confirmLabel={`Delete bucket ${bucket?.name}`}
    />
  )
}

export default DeleteBucketModal
