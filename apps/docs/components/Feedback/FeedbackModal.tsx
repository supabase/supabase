import { Button, Form, Input, Modal } from 'ui'

export type FeedbackFields = {
  page: string
  title: string
  comment: string
}

type FeedbackModalProps = {
  visible: boolean
  page: string
  onCancel: () => void
  onSubmit: (values: FeedbackFields) => void
}

function FeedbackModal({ visible, page, onCancel, onSubmit }: FeedbackModalProps) {
  return (
    <Modal hideFooter header="Leave a comment" visible={visible} onEscapeKeyDown={onCancel}>
      <Form
        initialValues={{ page, comment: '' }}
        validateOnBlur
        validate={(vals) => {
          const errors: Partial<FeedbackFields> = {}

          if (!vals.title) {
            errors.title = 'Required'
          }

          if (!vals.comment) {
            errors.comment = 'Required'
          }

          return errors
        }}
        onReset={onCancel}
        onSubmit={onSubmit}
      >
        {({ isSubmitting }: { isSubmitting: boolean }) => (
          <>
            <Modal.Content className="pt-4 pb-2 flex flex-col gap-2">
              <Input type="hidden" id="page" name="page" value={page} />
              <Input type="text" id="title" name="title" label="Title" className="mb-2" />
              <Input.TextArea
                label="Comment"
                id="comment"
                name="comment"
                size="medium"
                className="mb-2"
                textAreaClassName="resize-none"
                afterLabel=" (not anonymous)"
              />
            </Modal.Content>
            <Modal.Separator />
            <Modal.Content className="pt-2 pb-4">
              <div className="flex items-center justify-end gap-2">
                <Button htmlType="reset" type="default" onClick={onCancel} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button htmlType="submit" loading={isSubmitting} disabled={isSubmitting}>
                  Submit feedback
                </Button>
              </div>
            </Modal.Content>
          </>
        )}
      </Form>
    </Modal>
  )
}

export { FeedbackModal }
