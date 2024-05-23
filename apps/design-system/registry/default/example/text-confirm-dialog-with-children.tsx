'use client'

import { useState } from 'react'
import { Button, useToast } from 'ui'
import { UserPlus } from 'lucide-react'
import TextConfirmModal from 'ui-patterns/Dialogs/TextConfirmModal'

const TextConfirmModalWithChildren = () => {
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)

  const { toast } = useToast()

  function onVisibleChange() {
    setVisible(!visible)
  }

  function onSubmit() {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setVisible(false)
      toast({
        title: 'Updated project',
        description: 'Friday, February 10, 2023 at 5:57 PM',
      })
    }, 3000)
  }

  return (
    <>
      <Button type="default" onClick={onVisibleChange}>
        Open warning text confirm dialog
      </Button>
      <TextConfirmModal
        key="withChildren"
        confirmString="project name"
        visible={visible}
        variant="destructive"
        title="Are you sure you want to delete?"
        onCancel={onVisibleChange}
        loading={loading}
        confirmPlaceholder='Type "project name" to confirm'
        onConfirm={onSubmit}
      >
        <div className="flex flex-col gap-3 text-sm">
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
