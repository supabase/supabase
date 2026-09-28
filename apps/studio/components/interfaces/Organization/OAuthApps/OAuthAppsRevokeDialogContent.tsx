import { useParams } from 'common'
import { toast } from 'sonner'
import {
  Button,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
} from 'ui'

import { useOAuthAppRevokeMutation } from '@/data/oauth-apps/oauth-apps-revoke-mutation'
import type { OAuthApprovalItem } from '@/data/oauth-apps/types'

export interface OAuthAppsRevokeDialogProps {
  approval?: OAuthApprovalItem
  onClose: () => void
}

export const OAuthAppsRevokeDialogContent = ({ approval, onClose }: OAuthAppsRevokeDialogProps) => {
  const { slug } = useParams()

  const { mutate: revokeApp, isPending } = useOAuthAppRevokeMutation({
    onSuccess: () => {
      toast.success(`Revoked access for ${approval?.app.name}`)
      onClose()
    },
  })

  if (!approval) return null
  const hasOrgGrant = Boolean(approval.org_grant)

  return (
    <DialogContent size="small">
      <DialogHeader>
        <DialogTitle>Revoke access for {approval.app.name}</DialogTitle>
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
            {hasOrgGrant && (
              <li className="flex gap-x-2">
                <span aria-hidden>–</span>
                <span>The organization-wide grant will be revoked.</span>
              </li>
            )}
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
        <DialogClose asChild>
          <Button variant="default" disabled={isPending}>
            Cancel
          </Button>
        </DialogClose>
        <Button
          variant="danger"
          loading={isPending}
          onClick={() => {
            if (approval && slug) revokeApp({ slug, appId: approval.app.id })
          }}
        >
          Revoke
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
