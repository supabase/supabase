import { useState } from 'react'
import {
  Button,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

export default function ModalDemo() {
  const [visible, setVisible] = useState(false)

  return (
    <>
      <Button type="default" onClick={() => setVisible(!visible)}>
        Open Confirmation Modal
      </Button>
      <ConfirmationModal
        visible={visible}
        size="small"
        title="Resume this project"
        onCancel={() => setVisible(false)}
        onConfirm={() => {}}
        loading={false}
        confirmLabel="Resume"
        confirmLabelLoading="Resuming"
        cancelLabel="Cancel"
      >
        {/* Dialog contents */}
        <div className="flex flex-col gap-y-5">
          {/* Text content */}
          <p className="text-sm border-b border-border-muted pb-5">
            Your project’s data will be restored to when it was initially paused.
          </p>
          {/* Dropdown for Postgres version */}
          <div className="space-y-2">
            <label className="text-sm text-foreground-light">Postgres version</label>
            <Select_Shadcn_ defaultValue="17.6.1.054">
              <SelectTrigger_Shadcn_>
                <SelectValue_Shadcn_ />
              </SelectTrigger_Shadcn_>
              <SelectContent_Shadcn_>
                <SelectItem_Shadcn_ value="17.6.1.054">17.6.1.054</SelectItem_Shadcn_>
              </SelectContent_Shadcn_>
            </Select_Shadcn_>
          </div>
        </div>
      </ConfirmationModal>
    </>
  )
}
