import { useParams } from 'common'

import { useSqlTitleGenerateMutation } from 'data/ai/sql-title-mutation'
import { SqlSnippet } from 'data/content/sql-snippets-query'
import { isError } from 'data/utils/error-check'
import { useFlag, useSelectedOrganization, useStore } from 'hooks'
import { useEffect, useState } from 'react'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import { AiIconAnimation, Button, Form, Input, Modal } from 'ui'
import { subscriptionHasHipaaAddon } from '../Billing/Subscription/Subscription.utils'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'

export interface RenameQueryModalProps {
  snippet: SqlSnippet
  visible: boolean
  onCancel: () => void
  onComplete: () => void
}

const RenameQueryModal = ({ snippet, visible, onCancel, onComplete }: RenameQueryModalProps) => {
  const { ui } = useStore()
  const { ref } = useParams()
  const organization = useSelectedOrganization()
  const snap = useSqlEditorStateSnapshot()
  const supabaseAIEnabled = useFlag('sqlEditorSupabaseAI')
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: organization?.slug })

  // Customers on HIPAA plans should not have access to Supabase AI
  const hasHipaaAddon = subscriptionHasHipaaAddon(subscription)

  const { id, name, description } = snippet

  const [nameInput, setNameInput] = useState(name)
  const [descriptionInput, setDescriptionInput] = useState(description)

  useEffect(() => {
    setNameInput(name)
  }, [name])

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

  const { mutateAsync: titleSql, isLoading: isTitleGenerationLoading } =
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
              />
              <div className="flex w-full justify-end mt-2">
                {supabaseAIEnabled && !hasHipaaAddon && isAiButtonVisible && (
                  <Button
                    type="default"
                    onClick={async () => {
                      try {
                        const { title, description } = await titleSql({
                          sql: snippet.content.sql,
                        })

                        setNameInput(title)

                        // Only update description if it was empty
                        if (!descriptionInput) {
                          setDescriptionInput(description)
                        }
                      } catch (error: unknown) {
                        if (isError(error)) {
                          ui.setNotification({
                            category: 'error',
                            message: `Failed to rename query: ${error.message}`,
                          })
                        }
                      }
                    }}
                    size="tiny"
                    disabled={isTitleGenerationLoading}
                  >
                    <div className="flex items-center gap-1">
                      <div className="scale-75">
                        <AiIconAnimation loading={isTitleGenerationLoading} />
                      </div>
                      <span>Rename with Supabase AI</span>
                    </div>
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
