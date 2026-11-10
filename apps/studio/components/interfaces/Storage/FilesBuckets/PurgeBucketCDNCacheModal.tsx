import { useParams } from 'common'
import { useState } from 'react'
import { toast } from 'sonner'

import { PurgeCDNCacheDialog } from '@/components/interfaces/Storage/FilesBuckets/PurgeCDNCacheDialog'
import { useBucketPurgeCDNCacheMutation } from '@/data/storage/bucket-purge-cdn-cache-mutation'
import { Bucket } from '@/data/storage/buckets-query'

export interface PurgeBucketCDNCacheModalProps {
  visible: boolean
  bucket: Bucket
  onClose: () => void
}

export const PurgeBucketCDNCacheModal = ({
  visible,
  bucket,
  onClose,
}: PurgeBucketCDNCacheModalProps) => {
  const [status, setStatus] = useState('')
  const { ref: projectRef } = useParams()

  const { mutateAsync: purgeBucketCDNCache, isPending: isPurgingBucketCDNCache } =
    useBucketPurgeCDNCacheMutation({
      onSuccess: async () => {
        setStatus('')
        // No need to set a status as we show a toast
        toast.success(`Successfully purged CDN cache for bucket “${bucket.name}”`)
        onClose()
      },
      async onError(data) {
        // No need to set a status as we show a toast
        setStatus('')
        toast.error(`Failed to purge CDN cache for bucket “${bucket.name}”: ${data.message}`)
      },
    })

  const onConfirm = async () => {
    if (!projectRef) return console.error('Project ref is required')
    if (!bucket) return console.error('No bucket is selected')
    setStatus(`Purging CDN cache for bucket “${bucket.name}”…`)
    return purgeBucketCDNCache({ projectRef, id: bucket.id })
  }

  return (
    <PurgeCDNCacheDialog
      visible={visible}
      title={`Purge bucket “${bucket.name}” CDN cache`}
      status={status}
      isPurging={isPurgingBucketCDNCache}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  )
}
