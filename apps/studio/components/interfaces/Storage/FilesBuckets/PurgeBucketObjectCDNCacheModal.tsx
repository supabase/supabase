import { useParams } from 'common'
import { useState } from 'react'
import { toast } from 'sonner'

import { PurgeCDNCacheDialog } from '@/components/interfaces/Storage/FilesBuckets/PurgeCDNCacheDialog'
import { useBucketObjectPurgeCDNCacheMutation } from '@/data/storage/bucket-object-purge-cdn-cache-mutation'
import { Bucket } from '@/data/storage/buckets-query'

export interface PurgeBucketObjectCDNCacheModalProps {
  visible: boolean
  bucket: Bucket
  path: string
  onClose: () => void
}

export const PurgeBucketObjectCDNCacheModal = ({
  visible,
  bucket,
  path,
  onClose,
}: PurgeBucketObjectCDNCacheModalProps) => {
  const [status, setStatus] = useState('')
  const { ref: projectRef } = useParams()

  const { mutateAsync: purgeBucketObjectCDNCache, isPending: isPurgingBucketCDNCache } =
    useBucketObjectPurgeCDNCacheMutation({
      onSuccess: async () => {
        setStatus('')
        // No need to set a status as we show a toast
        toast.success(`Successfully purged CDN cache for “${path}” in bucket “${bucket.name}”`)
        onClose()
      },
      async onError(data) {
        // No need to set a status as we show a toast
        setStatus('')
        toast.error(
          `Failed to purge CDN cache for “${path}” in bucket “${bucket.name}”: ${data.message}`
        )
      },
    })

  const onConfirm = async () => {
    if (!projectRef) return console.error('Project ref is required')
    if (!bucket) return console.error('No bucket is selected')
    setStatus(`Purging CDN cache for object at path “${path}” in bucket “${bucket.name}”…`)
    return purgeBucketObjectCDNCache({ projectRef, id: bucket.id, path })
  }

  return (
    <PurgeCDNCacheDialog
      visible={visible}
      title="Purge CDN cache for file"
      description={`The CDN cache for the file "${path}" will be purged.`}
      status={status}
      isPurging={isPurgingBucketCDNCache}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  )
}
