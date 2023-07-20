import { useParams } from 'common'
import { useSqlTitleGenerateMutation } from 'data/ai/sql-title-mutation'
import { SqlSnippet } from 'data/content/sql-snippets-query'
import { useStore } from 'hooks'
import { useState } from 'react'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import { AiIcon, Button, Form, IconLoader, Input, Modal, cn } from 'ui'

export interface RenameQueryModalProps {
  snippet: SqlSnippet
  visible: boolean
  onCancel: () => void
  onComplete: () => void
}

const RenameQueryModal = ({ snippet, visible, onCancel, onComplete }: RenameQueryModalProps) => {
  const { ui } = useStore()
  const { ref } = useParams()
  const snap = useSqlEditorStateSnapshot()

  const { id, name, description } = snippet

  const [nameInput, setNameInput] = useState(name)

  const validate = () => {
    const errors: any = {}
    if (!nameInput) errors.name = 'Please enter a query name'
    return errors
  }

  const onSubmit = async (values: any, { setSubmitting }: any) => {
    if (!ref) return console.error('Project ref is required')
    if (!id) return console.error('Snippet ID is required')

    setSubmitting(true)
    try {
      snap.renameSnippet(id, nameInput, values.description)
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

  const { mutateAsync: generateSqlTitle, isLoading: isTitleGenerationLoading } =
    useSqlTitleGenerateMutation()

  const isAiButtonVisible = !!snippet.content.sql

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
              <Input
                label="Name"
                id="name"
                name="name"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                inputClassName={cn(isAiButtonVisible && 'pr-[6.5rem]')}
                actions={
                  isAiButtonVisible ? (
                    <Button
                      onClick={async () => {
                        const { title } = await generateSqlTitle({ sql: snippet.content.sql })
                        setNameInput(title)
                      }}
                      icon={
                        !isTitleGenerationLoading ? (
                          <AiIcon className="w-3 h-3" />
                        ) : (
                          <IconLoader className="animate-spin" size={14} />
                        )
                      }
                    >
                      Generate
                    </Button>
                  ) : undefined
                }
              />
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
