import { Button, Form, Input, Modal } from 'ui'

type SavedQuery = { name: string; description: string | null }

export interface UpdateSavedQueryProps {
  visible: boolean
  onCancel: () => void
  onSubmit: (newValues: SavedQuery) => void
  initialValues: SavedQuery
}

export const UpdateSavedQueryModal = ({
  visible,
  onCancel,
  onSubmit,
  initialValues,
}: UpdateSavedQueryProps) => {
  function validate(values: SavedQuery) {
    const errors: Partial<SavedQuery> = {}

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
      header="Update saved query"
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
          <>
            <Modal.Content>
              <Input label="Name" id="name" name="name" />
            </Modal.Content>
            <Modal.Content>
              <Input.TextArea
                label="Description"
                id="description"
                placeholder="Describe query"
                size="medium"
                textAreaClassName="resize-none"
              />
            </Modal.Content>
            <Modal.Separator />
            <Modal.Content className="flex items-center justify-end gap-2">
              <Button htmlType="reset" type="default" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button htmlType="submit" loading={isSubmitting} disabled={isSubmitting}>
                Save query
              </Button>
            </Modal.Content>
          </>
        )}
      </Form>
    </Modal>
  )
}
