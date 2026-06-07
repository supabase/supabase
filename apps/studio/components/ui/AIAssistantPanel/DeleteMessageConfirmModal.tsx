import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
} from 'ui'

type DeleteMessageConfirmModalProps = {
  visible: boolean
  onConfirm: () => void
  onCancel: () => void
}

export const DeleteMessageConfirmModal = ({
  visible,
  onConfirm,
  onCancel,
}: DeleteMessageConfirmModalProps) => {
  const onOpenChange = (open: boolean) => {
    if (!open) onCancel()
  }

  return (
    <Dialog open={visible} onOpenChange={onOpenChange}>
      <DialogContent size="small">
        <DialogHeader padding="small">
          <DialogTitle>Delete Message</DialogTitle>
        </DialogHeader>

        <DialogSectionSeparator />

        <DialogSection padding="small">
          <p className="text-sm text-foreground-light">
            Are you sure you want to delete this message and all subsequent messages? This action
            cannot be undone.
          </p>
        </DialogSection>

        <DialogFooter padding="small">
          <Button type="default" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="danger" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
