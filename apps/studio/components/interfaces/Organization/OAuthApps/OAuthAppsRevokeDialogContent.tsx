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

import type { OAuthAppDatabaseAccess } from './OAuthAppsAuthorizedPreview'
import { AlertError } from '@/components/ui/AlertError'
import { OAuthApproval } from '@/data/oauth-apps/oauth-apps-approvals-query'
import { useOAuthAppRevokeMutation } from '@/data/oauth-apps/oauth-apps-revoke-mutation'

export interface OAuthAppsRevokeDialogProps extends ComponentProps<typeof DialogContent> {
  approval?: OAuthApproval
  databaseAccess?: OAuthAppDatabaseAccess
  isPreview?: boolean
  onClose: () => void
}

export const OAuthAppsRevokeDialogContent = ({
  approval,
  databaseAccess,
  isPreview = false,
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
      toast.success(`Revoked access for ${approval?.attributes.app.name}`)
      onClose()
    },
    onError: () => {
      // Do nothing, we just want to avoid the default toast.
      // Error is displayed in the AlertError below
    },
  })

  if (!approval) return null
  const hasOrgGrant = Boolean(approval.attributes.org_grant)

  return (
    <DialogContent size="medium" {...props}>
      <DialogHeader>
        <DialogTitle>Revoke access for {approval.attributes.app.name}</DialogTitle>
      </DialogHeader>
      <DialogSectionSeparator />

      {isError && (
        <AlertError
          subject={`An error occurred while revoking this ${approval.attributes.app.name} grant`}
          className="mb-0 rounded-none border-x-0 border-t-0"
          error={error}
        />
      )}

      <DialogSection className="flex flex-col gap-y-2 text-sm text-foreground-light">
        <p>
          Revoking access removes app for the{' '}
          <span className="font-medium text-foreground">entire organization</span>:
        </p>

        <ul className="flex flex-col gap-y-1 list-disc pl-6">
          {hasOrgGrant && <li>The organization-wide grant is removed</li>}
          <li>All members lose access on the app's next request</li>
          <li>Members must authorize the app again to reconnect</li>
        </ul>
      </DialogSection>

      {databaseAccess && (
        <>
          <DialogSectionSeparator />
          <DialogSection className="flex flex-col gap-2 text-sm text-foreground-light">
            <h3 className="font-medium text-foreground">Direct database access</h3>
            <p>
              New connections will be blocked immediately. Supabase will close open connections.
            </p>
            <p>
              The <code className="break-all">{databaseAccess.role}</code> role will stay in the
              database with login disabled.
            </p>
          </DialogSection>
        </>
      )}

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="default" disabled={isPending} onClick={() => reset()}>
            Cancel
          </Button>
        </DialogClose>
        <Button
          variant="danger"
          loading={isPending}
          disabled={isPreview}
          onClick={() => {
            if (!isPreview && slug) revokeApp({ slug, appId: approval.id })
          }}
        >
          Revoke
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
