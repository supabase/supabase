import { useParams } from 'common'

import { useSqlTitleGenerateMutation } from 'data/ai/sql-title-mutation'
import { SqlSnippet } from 'data/content/sql-snippets-query'
import { useStore, useFlag } from 'hooks'
import { useState } from 'react'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import { AiIconAnimation, Button, Form, Input, Modal } from 'ui'

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
  const supabaseAIEnabled = useFlag('sqlEditorSupabaseAI')

  const { id, name, description } = snippet

  const [nameInput, setNameInput] = useState(name)
  const [descriptionInput, setDescriptionInput] = useState(description)

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
      snap.renameSnippet(id, nameInput, descriptionInput)
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
                // inputClassName={cn(isAiButtonVisible && 'pr-[6.5rem]')}
                // actions={}
              />
              <div className="flex w-full justify-end mt-2">
                {isAiButtonVisible && (
                  <Button
                    type="default"
                    onClick={async () => {
                      const { title, description } = await generateSqlTitle({
                        sql: snippet.content.sql,
                      })
                      setNameInput(title)
                      if (!descriptionInput) {
                        setDescriptionInput(description)
                      }
                    }}
                    size="tiny"
                    disabled={isTitleGenerationLoading}
                    // className="!px-2 !py-0.5 !pr-3"
                  >
                    {supabaseAIEnabled && (
                      <div className="flex items-center gap-1">
                        <AiIconAnimation loading={isTitleGenerationLoading} className="scale-75" />
                        <span>Rename with AI</span>
                      </div>
                    )}
                  </Button>
                )}
              </div>
            </Modal.Content>
            <Modal.Content>
              <Input.TextArea
                label="Description"
                id="description"
                placeholder="Describe query"
                size="medium"
                textAreaClassName="resize-none"
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
              />
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
