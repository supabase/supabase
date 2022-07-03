import React, { useState } from 'react'
import { Button, Modal } from '@supabase/ui'
import { render, unmountComponentAtNode } from 'react-dom'
import reactVirtualizedAutoSizer from 'react-virtualized-auto-sizer';

function ConfirmModal({
  title,
  message: description,
  onConfirm,
  onAsyncConfirm,
  variant,
}: { title: string | React.ReactNode; message: string; onConfirm?: () => void; onAsyncConfirm?: () => void; variant?: 'danger' }) {
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
            Confirm
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
    // @ts-ignore
    target.parentNode.removeChild(target)
  }
}

function createElement(properties: { title: string | React.ReactNode; message: string; onConfirm?: () => void; onAsyncConfirm?: () => void; variant?: 'danger' }) {
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

export function confirmAlert(properties: { title: string | React.ReactNode; message: string; onConfirm?: () => void; onAsyncConfirm?: () => void; variant?: 'danger' }) {
  createElement(properties)
}
