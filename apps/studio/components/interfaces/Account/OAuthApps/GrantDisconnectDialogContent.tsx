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

import { useOAuthGrantRevokeMutation } from '@/data/oauth-apps/oauth-apps-revoke-grant-mutation'
import { MemberOauthGrantItem } from '@/data/oauth-apps/types'

interface GrantDisconnectDialogContentProps extends ComponentProps<typeof DialogContent> {
  grant: MemberOauthGrantItem
  onClose: () => void
}

export const GrantDisconnectDialogContent = ({
  grant,
  onClose,
  ...props
}: GrantDisconnectDialogContentProps) => {
  const { mutate: revokeGrant, isPending } = useOAuthGrantRevokeMutation({
    onSuccess: () => {
      toast.success(`Revoked access for ${grant?.app?.name}`)
      onClose()
    },
  })

  return (
    <DialogContent size="small" {...props}>
      <DialogHeader>
        <DialogTitle>Revoke access for {grant?.app?.name}</DialogTitle>
      </DialogHeader>
      <DialogSectionSeparator />
      <DialogSection>
        <div className="flex flex-col gap-4 text-sm text-foreground-light">
          <p>
            {grant?.app.name} will no longer be able to access your projects. To reconnect,
            authorize {grant?.app.name} again and reselect your projects.
          </p>
          <p>Other organization members won't be affected.</p>
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
            if (grant) revokeGrant({ slug: grant.organization.slug, grantId: grant.grant_id })
          }}
        >
          Revoke
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
