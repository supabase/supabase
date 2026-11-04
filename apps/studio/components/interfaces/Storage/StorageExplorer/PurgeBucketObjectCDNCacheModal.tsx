import { useParams } from 'common'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from 'ui'

import { UpgradePlanButton } from '@/components/ui/UpgradePlanButton'
import { useBucketObjectPurgeCDNCacheMutation } from '@/data/storage/bucket-object-purge-cdn-cache-mutation'
import { Bucket } from '@/data/storage/buckets-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

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
  const { data: organization } = useSelectedOrganizationQuery()
  const isFreePlan = organization?.plan.id === 'free'

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
          `Failed to purge CDN cache for “${path} in bucket “${bucket.name}””: ${data.message}`
        )
      },
    })

  const onConfirm = async () => {
    if (!projectRef) return console.error('Project ref is required')
    if (!bucket) return console.error('No bucket is selected')
    setStatus(`Purging CDN cache for object at path “${path}” in bucket “${bucket.name}”…`)
    return purgeBucketObjectCDNCache({ projectRef, id: bucket.id, path })
  }

  if (isFreePlan) {
    return (
      <AlertDialog
        open={visible}
        onOpenChange={(open) => {
          if (open) return
          onClose()
        }}
      >
        <AlertDialogContent
          size="medium"
          onClick={(event) =>
            // Avoid triggering the overlay click
            event.stopPropagation()
          }
          dialogOverlayProps={{
            onClick: () => {
              onClose()
            },
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>{`Purge “${path}” CDN cache`}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>Buckets CDN cache purge is not available on your plan.</p>
                <p>Upgrade your plan to purge buckets CDN cache</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <UpgradePlanButton source="upgrade" featureProposition="purge buckets CDN cache" />
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return (
    <AlertDialog
      open={visible}
      onOpenChange={(open) => {
        if (!open && isPurgingBucketCDNCache) return
        onClose()
      }}
    >
      <AlertDialogContent
        size="medium"
        onClick={(event) =>
          // Avoid triggering the overlay click
          event.stopPropagation()
        }
        dialogOverlayProps={{
          onClick: () => {
            if (isPurgingBucketCDNCache) return
            onClose()
          },
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{`Purge “${path}” CDN cache`}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                Invalidation can take <strong className="font-bold">up to 60 seconds</strong>{' '}
                propagate across all CDN edge nodes worldwide.
              </p>
              <p>
                Purging the CDN cache does not affect browser caches. Users may see the cached
                version until their browser cache expires.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPurgingBucketCDNCache}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={isPurgingBucketCDNCache} onClick={onConfirm}>
            Purge CDN cache
          </AlertDialogAction>
        </AlertDialogFooter>
        <div className="sr-only" aria-live="polite">
          {status}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
