import { useParams } from 'common'
import { ComponentProps } from 'react'
import { toast } from 'sonner'
import {
  Button,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
} from 'ui'

import { AlertError } from '@/components/ui/AlertError'
import { useOAuthAppRevokeMutation } from '@/data/oauth-apps/oauth-apps-revoke-mutation'
import type { OAuthApprovalItem } from '@/data/oauth-apps/types'

export interface OAuthAppsRevokeDialogProps extends ComponentProps<typeof DialogContent> {
  approval?: OAuthApprovalItem
  onClose: () => void
}

export const OAuthAppsRevokeDialogContent = ({
  approval,
  onClose,
  ...props
}: OAuthAppsRevokeDialogProps) => {
  const { slug } = useParams()

  const {
    mutate: revokeApp,
    isPending,
    isError,
    error,
    reset,
  } = useOAuthAppRevokeMutation({
    onSuccess: () => {
      toast.success(`Revoked access for ${approval?.app.name}`)
      onClose()
    },
    onError: () => {
      // Do nothing, we just want to avoid the default toast.
      // Error is displayed in the AlertError below
    },
  })

  if (!approval) return null
  const hasOrgGrant = Boolean(approval.org_grant)

  return (
    <DialogContent size="small" {...props}>
      <DialogHeader>
        <DialogTitle>Revoke access for {approval.app.name}</DialogTitle>
      </DialogHeader>
      <DialogSectionSeparator />
      {isError && (
        <AlertError
          subject={`An error occurred while revoking this ${approval.app.name} grant`}
          className="mb-0 rounded-none border-x-0 border-t-0"
          error={error}
        />
      )}

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
          <Button variant="default" disabled={isPending} onClick={() => reset()}>
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
