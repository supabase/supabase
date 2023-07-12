import { get as _get, find } from 'lodash'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

import { useParams } from 'common'
import TextConfirmModal from 'components/ui/Modals/TextConfirmModal'
import { useBucketDeleteMutation } from 'data/storage/bucket-delete-mutation'
import { Bucket, useBucketsQuery } from 'data/storage/buckets-query'
import { useStore } from 'hooks'
import { formatPoliciesForStorage } from './Storage.utils'

export interface DeleteBucketModalProps {
  visible: boolean
  bucket?: Bucket
  onClose: () => void
}

const DeleteBucketModal = ({ visible = false, bucket, onClose }: DeleteBucketModalProps) => {
  const router = useRouter()
  const { ui, meta } = useStore()
  const { ref: projectRef } = useParams()

  const [deleting, setDeleting] = useState(false)
  const { data } = useBucketsQuery({ projectRef })
  const { mutateAsync: deleteBucket } = useBucketDeleteMutation()

  const buckets = data ?? []

  useEffect(() => {
    setDeleting(false)
  }, [visible])

  const onDeleteBucket = async () => {
    if (!projectRef) return console.error('Project ref is required')
    if (!bucket) return console.error('No bucket is selected')

    setDeleting(true)
    try {
      await deleteBucket({ projectRef, id: bucket.id })

      // Clean up policies from the corresponding bucket that was deleted
      await meta.policies.loadBySchema('storage')
      const policies = meta.policies.list()
      const storageObjectsPolicies = policies.filter((policy) => policy.table === 'objects')
      const formattedStorageObjectPolicies = formatPoliciesForStorage(
        buckets,
        storageObjectsPolicies
      )
      const bucketPolicies = _get(
        find(formattedStorageObjectPolicies, { name: bucket.name }),
        ['policies'],
        []
      )
      await Promise.all(
        bucketPolicies.map((policy: any) => {
          meta.policies.del(policy.id)
        })
      )

      ui.setNotification({
        category: 'success',
        message: `Successfully deleted bucket ${bucket.name}`,
      })
      router.push(`/project/${projectRef}/storage/buckets`)
      onClose()
    } catch (error: any) {
      setDeleting(false)
      ui.setNotification({
        category: 'error',
        message: `Failed to delete bucket: ${error.message}`,
      })
    }
  }

  return (
    <TextConfirmModal
      visible={visible}
      title={`Confirm deletion of ${bucket?.name}`}
      confirmPlaceholder="Type in name of bucket"
      onConfirm={onDeleteBucket}
      onCancel={onClose}
      confirmString={bucket?.name ?? ''}
      loading={deleting}
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
