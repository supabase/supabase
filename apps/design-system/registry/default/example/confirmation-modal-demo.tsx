import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Button,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

export default function ConfirmationModalDemo() {
  const [visible, setVisible] = useState(false)
  const form = useForm({
    defaultValues: {
      postgresVersion: '17.6.1.054',
    },
  })

  return (
    <>
      <Button type="default" onClick={() => setVisible(!visible)}>
        Show Confirmation Modal
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
        <div>
          {/* Text content */}
          <p className="block text-sm pb-4 border-b border-border-muted">
            Your project’s data will be restored to when it was initially paused.
          </p>
          {/* Dropdown for Postgres version */}
          <div className="pt-4">
            <Form_Shadcn_ {...form}>
              <FormField_Shadcn_
                control={form.control}
                name="postgresVersion"
                render={({ field }) => (
                  <FormItemLayout layout="vertical" label="Postgres version">
                    <FormControl_Shadcn_>
                      <Select_Shadcn_ value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger_Shadcn_>
                          <SelectValue_Shadcn_ />
                        </SelectTrigger_Shadcn_>
                        <SelectContent_Shadcn_>
                          <SelectItem_Shadcn_ value="17.6.1.054">17.6.1.054</SelectItem_Shadcn_>
                          <SelectItem_Shadcn_ value="17.6.1.055">17.6.1.055</SelectItem_Shadcn_>
                        </SelectContent_Shadcn_>
                      </Select_Shadcn_>
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </Form_Shadcn_>
          </div>
        </div>
      </ConfirmationModal>
    </>
  )
}
