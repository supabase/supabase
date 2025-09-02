import { Bucket } from 'data/storage/buckets-query'
import { BucketModal } from './BucketModal'

export interface EditBucketModalProps {
  visible: boolean
  bucket: Bucket
  onClose: () => void
}

// @deprecated Use BucketModal with mode="edit" instead
export const EditBucketModal = ({ visible, bucket, onClose }: EditBucketModalProps) => {
  return <BucketModal mode="edit" visible={visible} bucket={bucket} onClose={onClose} />
}
