import { Button } from 'ui'
import { Admonition } from 'ui-patterns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'ui/src/components/shadcn/ui/dialog'
import { SigningKey } from 'state/jwt-secrets'

interface DeleteKeyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedKey: SigningKey | null
  onConfirm: () => Promise<void>
  isLoading: boolean
}

export const DeleteKeyDialog = ({
  open,
  onOpenChange,
  selectedKey,
  onConfirm,
  isLoading,
}: DeleteKeyDialogProps) => {
  if (!selectedKey) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete JWT Key</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this JWT key? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6">
          <Admonition type="warning">
            {selectedKey.status === 'in_use'
              ? 'This key is currently in use. Deleting it will prevent users from verifying tokens signed with this key.'
              : selectedKey.status === 'standby'
                ? 'This key is in standby. Deleting it will prevent it from being used in future rotations.'
                : 'This key was previously used. Deleting it will prevent users from verifying old tokens signed with this key.'}
          </Admonition>
        </div>
        <DialogFooter className="px-6 py-4">
          <Button type="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="danger" onClick={onConfirm} loading={isLoading}>
            Delete Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
