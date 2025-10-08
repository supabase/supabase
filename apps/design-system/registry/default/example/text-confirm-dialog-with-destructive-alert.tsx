'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from 'ui'
import TextConfirmModal from 'ui-patterns/Dialogs/TextConfirmModal'

const TextConfirmModalWithDestructiveAlert = () => {
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)

  function onVisibleChange() {
    setVisible(!visible)
  }

  function onSubmit() {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setVisible(false)
      toast('Updated project', { description: 'Friday, February 10, 2023 at 5:57 PM' })
    }, 3000)
  }

  return (
    <>
      <Button type="default" onClick={onVisibleChange}>
        Open warning text confirm dialog
      </Button>
      <TextConfirmModal
        key="withDestructiveAlert"
        confirmString="project name"
        visible={visible}
        variant="destructive"
        title="Are you sure you want to delete?"
        alert={{
          title: 'This is a warning',
          description: 'You are about to delete this item. This action cannot be undone.',
        }}
        onCancel={onVisibleChange}
        loading={loading}
        confirmPlaceholder='Type "project name" to confirm'
        onConfirm={onSubmit}
      />
    </>
  )
}

export default TextConfirmModalWithDestructiveAlert
