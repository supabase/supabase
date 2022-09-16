import React, { useState } from 'react'
import { Button, Modal } from '@supabase/ui'
import { render, unmountComponentAtNode } from 'react-dom'

function ConfirmModal({
  title,
  message: description,
  onConfirm,
  onAsyncConfirm,
  variant = 'danger',
  confirmText = 'Confirm',
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
      onClose()
    }
  }

  function onClose() {
    removeElement()
  }

  return (
    <Modal
      header={title}
      variant={variant}
      visible={true}
      size="small"
      onCancel={onCancelClick}
      onConfirm={onCancelClick}
      loading={loading}
      customFooter={
        <div className="flex items-center gap-2">
          <Button type="default" onClick={() => onCancelClick()}>
            Cancel
          </Button>
          <Button type="primary" onClick={() => onConfirmClick()} loading={loading}>
            {confirmText}
          </Button>
        </div>
      }
      children={
        description && (
          <Modal.Content>
            <p className="text-sm text-scale-1100 py-4">{description}</p>
          </Modal.Content>
        )
      }
    />
  )
}

function removeElement() {
  const target = document.getElementById('supabase-ui-confirm-alert')
  if (target) {
    unmountComponentAtNode(target)
    target.parentNode.removeChild(target)
  }
}

function createElement(properties) {
  let divTarget = document.getElementById('supabase-ui-confirm-alert')
  if (divTarget) {
    render(<ConfirmModal {...properties} />, divTarget)
  } else {
    divTarget = document.createElement('div')
    divTarget.id = 'supabase-ui-confirm-alert'
    document.body.appendChild(divTarget)
    render(<ConfirmModal {...properties} />, divTarget)
  }
}

export function confirmAlert(properties) {
  createElement(properties)
}
