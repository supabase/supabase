import React, { useState } from 'react'
import { Modal } from '@supabase/ui'

export default function ConfirmModal({
  title,
  message,
  onConfirm,
  onClose,
  onAsyncConfirm,
  visible,
}: {
  title: string | React.ReactNode
  message: string
  onConfirm: () => void
  onClose: () => void
  onAsyncConfirm?: () => void
  visible: boolean
}) {
  const [loading, setLoading] = useState(false)

  function onCancelClick() {
    if (!loading) onClose()
  }

  async function onConfirmClick() {
    if (onAsyncConfirm) {
      setLoading(true)
      await onAsyncConfirm()

      onClose()
    } else if (onConfirm) {
      onConfirm()
    }
  }

  return (
    <Modal
      variant="warning"
      visible={visible}
      title={title}
      description={message}
      showIcon={false}
      size="small"
      confirmText="OK"
      cancelText="Cancel"
      onCancel={onCancelClick}
      onConfirm={onConfirmClick}
      loading={loading}
    />
  )
}
