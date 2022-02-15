import React, { useState } from 'react'
import { Modal } from '@supabase/ui'
import { render, unmountComponentAtNode } from 'react-dom'

function ConfirmModal({
  title,
  message: description,
  onConfirm,
  onAsyncConfirm,
  variant = 'danger',
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
      variant={variant}
      visible={true}
      size="small"
      onCancel={onCancelClick}
      onConfirm={onConfirmClick}
      loading={loading}
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
