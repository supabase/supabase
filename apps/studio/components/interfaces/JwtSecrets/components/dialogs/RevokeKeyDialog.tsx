import { Button } from 'ui'
import { Admonition } from 'ui-patterns'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'ui/src/components/shadcn/ui/dialog'
import { SigningKey } from 'state/jwt-secrets'
import dayjs from 'dayjs'

interface RevokeKeyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedKey: SigningKey | null
  onConfirm: () => Promise<void>
  isLoading: boolean
}

export const RevokeKeyDialog = ({
  open,
  onOpenChange,
  selectedKey,
  onConfirm,
  isLoading,
}: RevokeKeyDialogProps) => {
  if (!selectedKey) return null

  const daysUntilRevokable = selectedKey
    ? 30 - dayjs().diff(dayjs(selectedKey.updated_at), 'days')
    : 0
  const canRevoke = daysUntilRevokable <= 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Revoke JWT Key</DialogTitle>
        </DialogHeader>

        {!canRevoke ? (
          <>
            <Admonition type="note">
              <h3 className="font-bold">This key cannot be revoked yet</h3>
              <p className="text-sm text-foreground-light">
                You must wait {daysUntilRevokable} days before this key can be revoked.
              </p>
            </Admonition>
            <DialogFooter>
              <Button type="default" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <Admonition type="warning">
              <h3 className="font-bold">Warning: This action is irreversible</h3>
              <p className="text-sm text-foreground-light">
                Revoking this key will invalidate any active sessions using this JWT secret. Users
                will need to log in again.
              </p>
            </Admonition>
            <DialogFooter>
              <Button type="default" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="warning" onClick={onConfirm} loading={isLoading}>
                Revoke key
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
