import { useState, useEffect } from 'react'
import { Modal, Button, Typography, IconAlertCircle, Divider, Input, Alert } from '@supabase/ui'

export default function TextConfirmModal({
  title,
  onConfirm,
  visible,
  onCancel,
  loading,
  confirmLabel,
  confirmPlaceholder,
  confirmString,
  alert,
  text,
}) {
  const [confirmValue, setConfirmValue] = useState('')

  useEffect(() => {
    // reset confirm value
    if (!visible) {
      setConfirmValue('')
    }
  }, [visible])

  return (
    <Modal
      size="small"
      visible={visible}
      header={title}
      customFooter={
        <>
          <div className="w-full">
            <Button
              danger
              disabled={confirmValue != confirmString}
              size="medium"
              type={confirmValue != confirmString ? 'outline' : 'primary'}
              block
              loading={loading}
              onClick={() => onConfirm()}
            >
              {confirmLabel}
            </Button>
          </div>
        </>
      }
      onConfirm={onConfirm}
      onCancel={onCancel}
      closable
    >
      <div className="w-full py-4">
        <div className="space-y-4">
          {alert && (
            <Modal.Content>
              <Alert variant="warning" withIcon title={alert} />
            </Modal.Content>
          )}
          <Modal.Content>
            <Typography.Text className="block">
              <p className="mb-2 text-sm">{text}</p>
            </Typography.Text>
          </Modal.Content>
          <Modal.Seperator />
          <Modal.Content>
            <Input
              label={
                <>
                  <span>
                    Type <span className="text-scale-1200">{confirmString}</span> to confirm.
                  </span>
                </>
              }
              value={confirmValue}
              onChange={(e) => setConfirmValue(e.target.value)}
              placeholder={confirmPlaceholder}
            />
          </Modal.Content>
        </div>
      </div>
    </Modal>
  )
}
