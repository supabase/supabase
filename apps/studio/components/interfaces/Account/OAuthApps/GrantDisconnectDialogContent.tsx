import { toast } from 'sonner'
import {
  Button,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'ui'

import { useOAuthAppRevokeMutation } from '@/data/oauth-apps/oauth-apps-revoke-mutation'
import { MemberOauthGrantItem } from '@/data/oauth-apps/types'

export const GrantDisconnectDialogContent = ({
  grant,
  onClose,
}: {
  grant: MemberOauthGrantItem
  onClose: () => void
}) => {
  const { mutate: revokeApp, isPending } = useOAuthAppRevokeMutation({
    onSuccess: () => {
      toast.success(`Revoked access for ${grant?.app?.name}`)
      onClose()
    },
  })

  return (
    <DialogContent size="small" onCloseAutoFocus={(event) => event.preventDefault()}>
      <DialogHeader>
        <DialogTitle>Revoke access for {grant?.app?.name}</DialogTitle>
        <DialogDescription asChild>
          <div className="flex flex-col gap-4 text-sm text-foreground-light">
            <p>
              {grant?.app.name} loses access on its next request. Nobody else in your organization
              is affected.
            </p>
            <p>
              You can reconnect it at any time by authorizing again. You'll pick projects again when
              you do.
            </p>
          </div>
        </DialogDescription>
      </DialogHeader>

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
            if (grant) revokeApp({ slug: grant.organization.slug, appId: grant.app.id })
          }}
        >
          Disconnect
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
