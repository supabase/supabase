import { useParams } from 'common'
import { ComponentProps } from 'react'
import { toast } from 'sonner'
import {
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from 'ui'

import type { OAuthAppDatabaseAccess } from './OAuthAppsAuthorizedPreview'
import { AlertError } from '@/components/ui/AlertError'
import { OAuthApproval } from '@/data/oauth-apps/oauth-apps-approvals-query'
import { useOAuthAppRevokeMutation } from '@/data/oauth-apps/oauth-apps-revoke-mutation'

export interface OAuthAppsRevokeDialogProps extends ComponentProps<typeof AlertDialogContent> {
  projects?: { name: string; ref: string }[]
  approval?: OAuthApproval
  databaseAccess?: OAuthAppDatabaseAccess
  isPreview?: boolean
  onClose: () => void
}

export const OAuthAppsRevokeDialogContent = ({
  approval,
  projects,
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
  const databaseLocation =
    projects?.length === 1 ? 'this project’s database' : 'each project’s database'

  return (
    <AlertDialogContent size="small" {...props}>
      <AlertDialogHeader>
        <AlertDialogTitle>Revoke access</AlertDialogTitle>
        <AlertDialogDescription>
          “{approval.attributes.app.name}” will lose access for this organization and all its
          members on its next request.
        </AlertDialogDescription>
      </AlertDialogHeader>
      {databaseAccess && (
        <p className="px-5 pb-4 text-sm text-foreground-light">
          Connections using <code>{databaseAccess.role}</code> will close. The role stays in{' '}
          {databaseLocation} with login disabled, blocking new connections. Objects the app created
          keep running.
        </p>
      )}
      {isError && <AlertError subject="Failed to revoke access" error={error} />}
      <AlertDialogFooter>
        <AlertDialogCancel asChild>
          <Button variant="default" disabled={isPending} onClick={() => reset()}>
            Cancel
          </Button>
        </AlertDialogCancel>
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
      </AlertDialogFooter>
    </AlertDialogContent>
  )
}
