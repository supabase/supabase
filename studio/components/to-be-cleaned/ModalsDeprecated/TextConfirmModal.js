import { useState, useEffect } from 'react'
import { Modal, Button, Typography, IconAlertCircle, Divider, Input } from '@supabase/ui'

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
      title={title}
      customFooter={
        <>
          <div className="space-x-2 w-full">
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
      <div className="w-full">
        <div className="space-y-4">
          {alert && (
            <div className="block w-full bg-yellow-500 bg-opacity-5 p-3 border border-yellow-500 border-opacity-50 rounded">
              <div className="flex space-x-3">
                <div>
                  <IconAlertCircle className="text-yellow-500" size="large" />
                </div>
                <Typography.Text type="warning">{alert}</Typography.Text>
              </div>
            </div>
          )}
          <Typography.Text className="block">
            <p className="mb-2 text-sm">{text}</p>
          </Typography.Text>
          <Divider light />
          <Typography.Text className="block">
            <p className="text-sm">
              Type <span className="dark:text-white font-medium">{confirmString}</span> to confirm.
            </p>
          </Typography.Text>
          <Input
            value={confirmValue}
            onChange={(e) => setConfirmValue(e.target.value)}
            placeholder={confirmPlaceholder}
          />
        </div>
      </div>
    </Modal>
  )
}
