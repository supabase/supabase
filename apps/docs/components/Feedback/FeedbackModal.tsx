import { Button, Form, Input, Modal } from 'ui'

export type Feedback = {
  page: string
  comment: string
}

type FeedbackModalProps = {
  visible: boolean
  page: string
  onCancel: () => void
  onSubmit: (values: Feedback) => void
}

function FeedbackModal({ visible, page, onCancel, onSubmit }: FeedbackModalProps) {
  return (
    <Modal hideFooter header="Leave a comment" visible={visible}>
      <Form
        onReset={onCancel}
        validateOnBlur
        initialValues={{ page, comment: '' }}
        validate={(vals) => {
          const errors: Partial<Feedback> = {}

          if (!vals.comment) {
            errors.comment = 'Required'
          }

          return errors
        }}
        onSubmit={onSubmit}
      >
        {({ isSubmitting }: { isSubmitting: boolean }) => (
          <>
            <Modal.Content className="pt-4 pb-2">
              <Input type="hidden" id="page" name="page" value={page} />
              <Input.TextArea
                label="Comment"
                id="comment"
                name="comment"
                size="medium"
                textAreaClassName="resize-none"
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
