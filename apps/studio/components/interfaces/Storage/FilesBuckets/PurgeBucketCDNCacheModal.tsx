import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { UpgradePlanButton } from '@/components/ui/UpgradePlanButton'
import { useBucketPurgeCDNCacheMutation } from '@/data/storage/bucket-purge-cdn-cache-mutation'
import { Bucket } from '@/data/storage/buckets-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

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
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const { data: organization } = useSelectedOrganizationQuery()
  const isFreePlan = organization?.plan.id === 'free'

  const { mutateAsync: purgeBucketCDNCache, isPending: isPurgingBucketCDNCache } =
    useBucketPurgeCDNCacheMutation({
      onSuccess: async () => {
        setStatus('')
        // No need to set a status as we show a toast
        toast.success(`Successfully purged CDN cache for bucket “${bucket.name}”`)
        onClose()
        if (bucket.id) router.push(`/project/${projectRef}/storage/files`)
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

  if (isFreePlan) {
    return (
      <Dialog
        open={visible}
        onOpenChange={(open) => {
          if (open) return
          onClose()
        }}
      >
        <DialogContent size="medium">
          <DialogHeader>
            <DialogTitle>{`Purge bucket “${bucket.name}” CDN cache`}</DialogTitle>
          </DialogHeader>
          <DialogSectionSeparator />
          <Admonition
            title="Buckets CDN cache purge is not available on your plan"
            description="Upgrade your plan to purge buckets CDN cache"
            className="mb-0 rounded-none border-none"
          />
          <DialogFooter>
            <DialogClose disabled={isPurgingBucketCDNCache} asChild>
              <Button>Cancel</Button>
            </DialogClose>
            <UpgradePlanButton source="upgrade" featureProposition="purge buckets CDN cache" />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog
      open={visible}
      onOpenChange={(open) => {
        if (!open && isPurgingBucketCDNCache) return
        onClose()
      }}
    >
      <DialogContent size="medium">
        <DialogHeader>
          <DialogTitle>{`Purge bucket “${bucket.name}” CDN cache`}</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection className="space-y-4">
          <p>
            After purging the cache, it can take{' '}
            <strong className="font-bold">up to 60 seconds</strong> for the invalidation to
            propagate across all CDN edge nodes worldwide. During this time, some users may still
            receive cached content depending on which edge node they are routed to.
          </p>
          <p>
            Keep in mind that purging the CDN cache does not affect browser caches. If users have
            the asset cached locally in their browser, they will continue to see the cached version
            until the browser cache expires based on the{' '}
            <code className="font-mono bg-surface-200 rounded-sm px-1 py-0.5">cacheControl</code>{' '}
            value set during upload.
          </p>
        </DialogSection>
        <DialogFooter>
          <DialogClose disabled={isPurgingBucketCDNCache} asChild>
            <Button>Cancel</Button>
          </DialogClose>
          <Button variant="primary" disabled={isPurgingBucketCDNCache} onClick={onConfirm}>
            Purge CDN cache
          </Button>
        </DialogFooter>
        <div className="sr-only" aria-live="polite">
          {status}
        </div>
      </DialogContent>
    </Dialog>
  )
}
