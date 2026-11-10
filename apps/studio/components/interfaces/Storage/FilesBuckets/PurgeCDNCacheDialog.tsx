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
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

interface PurgeCDNCacheDialogProps {
  visible: boolean
  title: string
  description: string
  status: string
  isPurging: boolean
  onConfirm: () => void
  onClose: () => void
}

export const PurgeCDNCacheDialog = ({
  visible,
  title,
  status,
  description,
  isPurging,
  onConfirm,
  onClose,
}: PurgeCDNCacheDialogProps) => {
  const { data: organization } = useSelectedOrganizationQuery()
  const isFreePlan = organization?.plan.id === 'free'

  return (
    <AlertDialog
      open={visible}
      onOpenChange={(open) => {
        if (!open && isPurging) return
        onClose()
      }}
    >
      <AlertDialogContent
        size={isFreePlan ? 'small' : 'medium'}
        onClick={(event) =>
          // Avoid triggering the overlay click
          event.stopPropagation()
        }
        dialogOverlayProps={{
          onClick: () => {
            if (isPurging) return
            onClose()
          },
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            {/* No Admonition (that has an alert role) here as we're already in an alertdialog */}
            <div className="space-y-4">
              {isFreePlan ? (
                <p>Purging the CDN cache requires the Pro plan or higher.</p>
              ) : (
                <>
                  <p>
                    {description + ' '}
                    Invalidation can take <strong className="font-bold">up to 60 seconds</strong> to
                    propagate across all CDN edge nodes worldwide.
                  </p>
                  <p>
                    Purging the CDN cache does not affect browser caches. Users may see the cached
                    version until their browser cache expires.
                  </p>
                </>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPurging}>Cancel</AlertDialogCancel>
          {isFreePlan ? (
            <UpgradePlanButton source="storagePurgeCDNCache" featureProposition="purge CDN cache" />
          ) : (
            <AlertDialogAction disabled={isPurging} onClick={onConfirm}>
              Purge CDN cache
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
        <div className="sr-only" aria-live="polite">
          {status}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
