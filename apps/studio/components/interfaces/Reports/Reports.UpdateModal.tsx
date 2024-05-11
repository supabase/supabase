import { Button, Form, Input, Modal } from 'ui'

type CustomReport = { name: string; description?: string }

export interface UpdateCustomReportProps {
  visible: boolean
  onCancel: () => void
  onSubmit: (newValues: CustomReport) => void
  initialValues: CustomReport
}

export const UpdateCustomReportModal = ({
  visible,
  onCancel,
  onSubmit,
  initialValues,
}: UpdateCustomReportProps) => {
  function validate(values: CustomReport) {
    const errors: Partial<CustomReport> = {}

    if (!values.name) {
      errors.name = 'Required'
    }

    return errors
  }

  return (
    <Modal
      visible={visible}
      onCancel={onCancel}
      hideFooter
      header="Update custom report"
      size="small"
    >
      <Form
        onReset={onCancel}
        validateOnBlur
        initialValues={initialValues}
        validate={validate}
        onSubmit={onSubmit}
      >
        {({ isSubmitting }: { isSubmitting: boolean }) => (
          <div className="space-y-4 py-4">
            <Modal.Content>
              <Input label="Name" id="name" name="name" />
            </Modal.Content>
            <Modal.Content>
              <Input.TextArea
                label="Description"
                id="description"
                placeholder="Describe your custom report"
                size="medium"
                textAreaClassName="resize-none"
              />
            </Modal.Content>
            <Modal.Separator />
            <Modal.Content>
              <div className="flex items-center justify-end gap-2">
                <Button htmlType="reset" type="default" onClick={onCancel} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button htmlType="submit" loading={isSubmitting} disabled={isSubmitting}>
                  Save custom report
                </Button>
              </div>
            </Modal.Content>
          </div>
        )}
      </Form>
    </Modal>
  )
}
