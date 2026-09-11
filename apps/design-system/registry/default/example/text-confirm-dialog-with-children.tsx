'use client'

import { UserPlus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'
import TextConfirmModal from 'ui-patterns/Dialogs/TextConfirmModal'

const TextConfirmModalWithChildren = () => {
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const projectName = 'my-production-app'

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
      <Button variant="danger" onClick={onVisibleChange}>
        Show Text Confirm Dialog
      </Button>
      <TextConfirmModal
        key="withChildren"
        confirmAction="delete"
        confirmSubject="this project"
        visible={visible}
        variant="destructive"
        title="Are you sure you want to delete?"
        onCancel={onVisibleChange}
        loading={loading}
        onConfirm={onSubmit}
      >
        <div className="flex flex-col gap-3 text-sm">
          <p>
            This will permanently delete{' '}
            <span className="font-medium text-foreground">{projectName}</span>.
          </p>
          <div className="flex gap-3 items-center">
            <UserPlus className="text-foreground-lighter" />
            <p>
              This is a paragraph <strong>with some bold text</strong>
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <UserPlus className="text-foreground-lighter" />
            <p>
              This is a paragraph <strong>with some bold text</strong>
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <UserPlus className="text-foreground-lighter" />
            <p>
              This is a paragraph <strong>with some bold text</strong>
            </p>
          </div>
        </div>
      </TextConfirmModal>
    </>
  )
}

export default TextConfirmModalWithChildren
