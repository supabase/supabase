import { useParams } from 'common'
import { toast } from 'sonner'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
} from 'ui'

import { useOAuthAppRevokeMutation } from '@/data/oauth-apps/oauth-apps-revoke-mutation'
import type { OAuthAppOverviewItem } from '@/data/oauth-apps/types'

export interface OAuthAppsRevokeDialogProps {
  app?: OAuthAppOverviewItem
  onClose: () => void
}

export const OAuthAppsRevokeDialog = ({ app, onClose }: OAuthAppsRevokeDialogProps) => {
  const { slug } = useParams()
  const { mutate: revokeApp, isPending } = useOAuthAppRevokeMutation({
    onSuccess: () => {
      toast.success(`Revoked access for ${app?.name}`)
      onClose()
    },
  })

  const memberGrantCount = app?.member_grant_count ?? 0
  const hasOrgGrant = Boolean(app?.org_grant)

  return (
    <Dialog open={Boolean(app)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="small">
        <DialogHeader>
          <DialogTitle>Revoke access for {app?.name}</DialogTitle>
        </DialogHeader>

        <DialogSection className="flex flex-col gap-4 text-sm text-foreground-light">
          <p>
            This revokes the app at{' '}
            <span className="font-medium text-foreground">organization level</span> and affects{' '}
            <span className="font-medium text-foreground">all users</span>.
          </p>

          <div className="flex flex-col gap-2">
            <p>Caveats:</p>
            <ul className="flex flex-col gap-1">
              <li className="flex gap-x-2">
                <span aria-hidden>–</span>
                <span>
                  {memberGrantCount} {memberGrantCount === 1 ? 'member grant' : 'member grants'}{' '}
                  will be revoked.
                </span>
              </li>
              {hasOrgGrant && (
                <li className="flex gap-x-2">
                  <span aria-hidden>–</span>
                  <span>The organization-wide grant will be revoked.</span>
                </li>
              )}
              <li className="flex gap-x-2">
                <span aria-hidden>–</span>
                <span>The app stays blocked for this organization until an admin unblocks it.</span>
              </li>
              <li className="flex gap-x-2">
                <span aria-hidden>–</span>
                <span>Every member loses access on the apps next request.</span>
              </li>
              <li className="flex gap-x-2">
                <span aria-hidden>–</span>
                <span>Members will need to authorize again to reconnect.</span>
              </li>
              <li className="flex gap-x-2">
                <span aria-hidden>–</span>
                <span>
                  This is <span className="font-medium text-foreground">not</span> a per-user
                  revocation.
                </span>
              </li>
            </ul>
          </div>
        </DialogSection>

        <DialogFooter>
          <Button variant="default" disabled={isPending} onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={isPending}
            onClick={() => {
              if (app && slug) revokeApp({ slug, appId: app.id })
            }}
          >
            Revoke
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
