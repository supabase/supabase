import { useParams } from 'common'
import { useStore } from 'hooks'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import { Button, Form, Input, Modal } from 'ui'

export interface RenameQueryModalProps {
  snippet: any
  visible: boolean
  onCancel: () => void
  onComplete: () => void
}

const RenameQueryModal = ({ snippet, visible, onCancel, onComplete }: RenameQueryModalProps) => {
  const { ui } = useStore()
  const { ref } = useParams()
  const snap = useSqlEditorStateSnapshot()

  const { id, name, description } = snippet

  const validate = (values: any) => {
    const errors: any = {}
    if (!values.name) errors.name = 'Please enter a query name'
    return errors
  }

  const onSubmit = async (values: any, { setSubmitting }: any) => {
    if (!ref) return console.error('Project ref is required')
    if (!id) return console.error('Snippet ID is required')

    setSubmitting(true)
    try {
      snap.renameSnippet(id, values.name, values.description)
      if (onComplete) onComplete()
      return Promise.resolve()
    } catch (error: any) {
      ui.setNotification({
        error,
        category: 'error',
        message: `Failed to rename query: ${error.message}`,
      })
    }
  }

  return (
    <Modal visible={visible} onCancel={onCancel} hideFooter header="Rename" size="small">
      <Form
        onReset={onCancel}
        validateOnBlur
        initialValues={{
          name: name ?? '',
          description: description ?? '',
        }}
        validate={validate}
        onSubmit={onSubmit}
      >
        {({ isSubmitting }: { isSubmitting: boolean }) => (
          <div className="space-y-4 py-4">
            <Modal.Content>
              <Input label="Name" id="name" name="name" />
            </Modal.Content>
            <Modal.Content>
              <Input label="Description" id="description" placeholder="Describe query" />
            </Modal.Content>
            <Modal.Separator />
            <Modal.Content>
              <div className="flex items-center justify-end gap-2">
                <Button htmlType="reset" type="default" onClick={onCancel} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button htmlType="submit" loading={isSubmitting} disabled={isSubmitting}>
                  Rename query
                </Button>
              </div>
            </Modal.Content>
          </div>
        )}
      </Form>
    </Modal>
  )
}

export default RenameQueryModal
