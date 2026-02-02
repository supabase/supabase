'use client'

import { useState } from 'react'
import { Button } from 'ui'
import TextConfirmModal from 'ui-patterns/Dialogs/TextConfirmModal'

export default function TextConfirmDialogDemo() {
  const [visible, setVisible] = useState(false)
  const bucketName = 'profile-pictures'

  return (
    <>
      <Button type="danger" onClick={() => setVisible(true)}>
        Show Text Confirm Dialog
      </Button>

      <TextConfirmModal
        visible={visible}
        size="small"
        variant="destructive"
        title="Delete bucket"
        confirmPlaceholder={bucketName}
        confirmString={bucketName}
        confirmLabel="Delete bucket"
        loading={false}
        onConfirm={() => setVisible(false)}
        onCancel={() => setVisible(false)}
      >
        <p className="text-sm">
          Your bucket <span className="font-medium text-foreground">{bucketName}</span> and all of
          its contents will be permanently deleted. This action cannot be undone.
        </p>
      </TextConfirmModal>
    </>
  )
}
