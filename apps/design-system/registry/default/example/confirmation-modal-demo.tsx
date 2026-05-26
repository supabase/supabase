import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Button,
  Form,
  FormControl,
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
            <Form {...form}>
              <FormField
                control={form.control}
                name="postgresVersion"
                render={({ field }) => (
                  <FormItemLayout layout="vertical" label="Postgres version">
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="17.6.1.054">17.6.1.054</SelectItem>
                          <SelectItem value="17.6.1.055">17.6.1.055</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItemLayout>
                )}
              />
            </Form>
          </div>
        </div>
      </ConfirmationModal>
    </>
  )
}
