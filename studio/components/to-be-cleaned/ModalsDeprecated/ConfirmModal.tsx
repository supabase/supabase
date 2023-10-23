import { useState } from 'react'
import { Button, Modal } from 'ui'

interface ConfirmAlertProps {
  title: string
  message: string
  onConfirm?: () => void
  onAsyncConfirm?: () => Promise<void>
  variant?: 'danger' | 'warning' | 'success'
  confirmText?: string
}

export function ConfirmAlert({
  title,
  message: description,
  onConfirm,
  onAsyncConfirm,
  variant = 'danger',
  confirmText = 'Confirm',
}: ConfirmAlertProps) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  function onCancel() {
    if (!loading) setOpen(false)
  }

  async function onConfirmClick() {
    if (onAsyncConfirm) {
      setLoading(true)
      await onAsyncConfirm()

      setOpen(false)
    } else if (onConfirm) {
      onConfirm()
      setOpen(false)
    }
  }

  return (
    <Modal
      header={title}
      variant={variant}
      visible={open}
      size="small"
      onCancel={() => onCancel()}
      loading={loading}
      customFooter={
        <div className="flex items-center gap-2">
          <Button type="default" disabled={loading} loading={loading} onClick={() => onCancel()}>
            Cancel
          </Button>
          <Button
            type="primary"
            disabled={loading}
            onClick={() => onConfirmClick()}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      }
    >
      {description && (
        <Modal.Content>
          <p className="py-4 text-sm text-foreground-light">{description}</p>
        </Modal.Content>
      )}
    </Modal>
  )
}
