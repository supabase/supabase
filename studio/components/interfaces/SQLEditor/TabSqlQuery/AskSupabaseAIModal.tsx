import { stripIndent } from 'common-tags'
import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'
import { useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { useState, useEffect, useRef } from 'react'
import { Badge, Form, IconUser, Input, Modal } from 'ui'
import { AiIcon } from './UtilityActions'

interface AskSupabaseAIModalProps {
  visible: boolean
  onClose: () => void
}

const AskSupabaseAIModal = ({ visible, onClose }: AskSupabaseAIModalProps) => {
  const { ui, meta } = useStore()
  const chatRef = useRef<any>()

  const [prompt, setPrompt] = useState('')
  const [prompts, setPrompts] = useState<string[]>([])
  const [outputs, setOutputs] = useState<string[]>([])

  useEffect(() => {
    if (visible) {
      setPrompt('')
    } else {
      setPrompts([])
      setOutputs([])
    }
  }, [visible])

  useEffect(() => {
    scrollToBottom()
  }, [JSON.stringify(prompts), JSON.stringify(outputs)])

  const scrollToBottom = () => {
    chatRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <Modal
      hideFooter
      visible={visible}
      size="xlarge"
      alignFooter="right"
      header={
        <div className="flex items-center space-x-2">
          <p>Generate SQL with Supabase AI</p>
          <Badge color="green">Alpha</Badge>
        </div>
      }
      confirmText="Generate SQL"
      onCancel={onClose}
    >
      <div className="py-4">
        <div
          className={`transition-all duration-300 overflow-y-auto ${
            prompts.length > 0 ? 'pb-2' : ''
          }`}
          style={{ maxHeight: prompts.length === 0 ? 0 : '350px' }}
        >
          <div className="space-y-4">
            {prompts.map((p, idx) => {
              const output = outputs[idx]

              return (
                <Modal.Content key={`prompt-${idx}`}>
                  <div className="space-y-4">
                    <div className="flex space-x-4">
                      <div className="flex items-center justify-center w-7 h-7 bg-scale-200 rounded-full border border-scale-600">
                        <IconUser size="tiny" />
                      </div>
                      <p className="text-sm mt-1 text-scale-1100">{p}</p>
                    </div>
                    <div className="flex space-x-4">
                      <div className="flex items-center justify-center w-7 h-7 rounded-md border border-brand-400 bg-gradient-to-r from-brand-900 to-brand-800 ring-brand-600 ring-1">
                        <AiIcon className="w-4 h-4" />
                      </div>
                      {output == undefined ? (
                        <div className="w-2 h-4 bg-scale-900 mt-1 animate-bounce" />
                      ) : (
                        <div className="px-4 py-2 bg-scale-400 rounded-md border border-scale-600">
                          <SimpleCodeBlock language="sql">{output}</SimpleCodeBlock>
                        </div>
                      )}
                    </div>
                  </div>
                </Modal.Content>
              )
            })}
          </div>
          <div ref={chatRef} />
        </div>
        {prompts.length > 0 && (
          <div className="pb-2">
            <Modal.Separator />
          </div>
        )}
        <Modal.Content>
          <Form
            validateOnBlur
            initialValues={{ prompt: '' }}
            onSubmit={async (values: any, { setSubmitting, resetForm }: any) => {
              setPrompts(prompts.concat([values.prompt]))
              setSubmitting(true)

              const tables = (await meta.tables.loadBySchema('public')) as any[]
              const createTableQueries = tables.map((table) => {
                return stripIndent`
                  CREATE TABLE "${table.schema}"."${table.name}"
                  (
                  ${table.columns
                    .map(
                      (column: any) =>
                        `    ${column.name} ${column.data_type} ${
                          !column.is_nullable ? 'NOT NULL' : 'NULL'
                        }`
                    )
                    .join(',\n')}
                  );
                `
              })
              const response = await post('/api/natural-language', {
                query: prompt,
                tables: createTableQueries.join('\n'),
              })
              setSubmitting(false)

              if (response.error) {
                ui.setNotification({ category: 'error', message: 'Failed to generate SQL' })
              } else {
                setOutputs(outputs.concat(response.text))

                const updatedValues = { prompt: '' }
                resetForm({ initialValues: updatedValues, values: updatedValues })
              }
            }}
          >
            {({ isSubmitting }: { isSubmitting: boolean }) => (
              <div className="text-area-text-sm">
                <Input
                  autoFocus
                  id="prompt"
                  name="prompt"
                  disabled={isSubmitting}
                  label="Ask us anything, and we will try to generate the relevant SQL statements for you"
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="e.g Generate tables (with id bigserial & FK relationships) for blog posts and comments"
                />
              </div>
            )}
          </Form>
        </Modal.Content>
      </div>
    </Modal>
  )
}

export default AskSupabaseAIModal
