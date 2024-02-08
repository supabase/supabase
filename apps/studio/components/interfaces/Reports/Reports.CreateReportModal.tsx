import { Button, Form, Input, Modal } from 'ui'

type CustomReport = { name: string; description?: string }
export interface CreateReportModal {
  visible: boolean
  onCancel: () => void
  onSubmit: (values: CustomReport) => any
}

export const CreateReportModal = ({ visible, onCancel, onSubmit }: CreateReportModal) => {
  return (
    <Modal
      visible={visible}
      onCancel={onCancel}
      hideFooter
      header="Create a custom report"
      size="small"
    >
      <Form
        onReset={onCancel}
        validateOnBlur
        initialValues={{ name: '', description: '' }}
        validate={(vals) => {
          const errors: Partial<CustomReport> = {}

          if (!vals.name) {
            errors.name = 'Required'
          }

          return errors
        }}
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
                  Create report
                </Button>
              </div>
            </Modal.Content>
          </div>
        )}
      </Form>
    </Modal>
  )
}
