import { stripIndent } from 'common-tags'
import { useState, useEffect, useRef } from 'react'
import { Badge, Button, Form, IconCornerDownLeft, IconUser, Input, Modal, Toggle } from 'ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import Telemetry from 'lib/telemetry'
import { post } from 'lib/common/fetch'
import PromptOutput from './PromptOutput'
import { AiIcon } from './UtilityActions'
import { EXAMPLE_QUERIES } from './AskSupabaseAIModal.constants'
import { useProfileQuery } from 'data/profile/profile-query'
import { checkPermissions, useOptimisticSqlSnippetCreate, useStore } from 'hooks'

interface AskSupabaseAIModalProps {
  visible: boolean
  onClose: () => void
}

const AskSupabaseAIModal = ({ visible, onClose }: AskSupabaseAIModalProps) => {
  const { ui, meta } = useStore()
  const chatRef = useRef<any>()

  const [prompts, setPrompts] = useState<string[]>([])
  const [outputs, setOutputs] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: profile } = useProfileQuery()
  const canCreateSQLSnippet = checkPermissions(PermissionAction.CREATE, 'user_content', {
    resource: { type: 'sql', owner_id: profile?.id },
    subject: { id: profile?.id },
  })
  const handleNewQuery = useOptimisticSqlSnippetCreate(canCreateSQLSnippet)

  useEffect(() => {
    if (!visible) {
      // setPrompts([])
      // setOutputs([])
    } else {
      scrollToBottom()
    }
  }, [visible])

  useEffect(() => {
    scrollToBottom()
  }, [prompts, outputs])

  const scrollToBottom = () => {
    setTimeout(() => chatRef.current?.scrollIntoView({ behavior: 'smooth' }), 200)
  }

  const onSaveOutput = (output: string) => {
    const formattedOutput = `
-- Note: This query was generated via Supabase AI, please do verify the correctness of the
-- SQL snippet before running it against your database as we are not able to guarantee the
-- correctness of the snippet that was generated.

${output}
`.trim()
    handleNewQuery({ name: 'Generated query', sql: formattedOutput })
    Telemetry.sendEvent(
      {
        category: 'scripts',
        action: 'script_clicked',
        label: 'Generated query',
      },
      ui.googleAnalyticsProps
    )
    onClose()
  }

  const onSubmit = async (values: any, { resetForm }: any) => {
    setPrompts(prompts.concat([values.prompt]))
    scrollToBottom()
    setIsSubmitting(true)

    // [Joshen] We'll need to set up some acceptance policy that users are
    // okay with us sending over their table data to OpenAI before doing so

    // const tables = (await meta.tables.loadBySchema('public')) as any[]
    // const createTableQueries = tables.map((table) => {
    //   return stripIndent`
    //     CREATE TABLE "${table.schema}"."${table.name}"
    //     (
    //     ${table.columns
    //       .map(
    //         (column: any) =>
    //           `    ${column.name} ${column.data_type} ${!column.is_nullable ? 'NOT NULL' : 'NULL'}`
    //       )
    //       .join(',\n')}
    //     );
    //   `
    // }).join('\n')

    const response = await post('/api/natural-language', {
      query: values.prompt,
      tables: '',
    })
    setIsSubmitting(false)

    if (response.error) {
      ui.setNotification({ category: 'error', message: 'Failed to generate SQL' })
      setOutputs(outputs.concat('Failed to generate SQL'))
    } else {
      setOutputs(outputs.concat(response.text))

      const updatedValues = { prompt: '' }
      resetForm({ initialValues: updatedValues, values: updatedValues })
    }
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
          style={{ maxHeight: prompts.length === 0 ? 0 : '380px' }}
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
                      <div>
                        <div className="flex items-center justify-center w-7 h-7 rounded-md border border-brand-400 bg-gradient-to-r from-brand-900 to-brand-800 ring-brand-600 ring-1">
                          <AiIcon className="w-4 h-4" />
                        </div>
                      </div>
                      {output == undefined ? (
                        <div className="w-2 h-4 bg-scale-900 mt-1 animate-bounce" />
                      ) : (
                        <PromptOutput output={output} onSaveOutput={onSaveOutput} />
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
        <Form validateOnBlur initialValues={{ prompt: '' }} onSubmit={onSubmit}>
          {({ resetForm }: { resetForm: any }) => (
            <div>
              <div className="flex items-center justify-between px-5 mb-2">
                <p className="text-sm text-scale-1200">
                  Ask us anything, and we will try to generate the relevant SQL statements for you
                </p>
                {prompts.length > 0 && (
                  <Button
                    type="default"
                    disabled={prompts.length === 0 || outputs.length === 0}
                    onClick={() => {
                      setPrompts([])
                      setOutputs([])
                    }}
                  >
                    Clear conversation
                  </Button>
                )}
              </div>
              {/* <div className="px-5 pt-2">
                <Toggle
                  label="Allow us to send your database structure to OpenAI when sending prompt"
                  descriptionText="This will allow us to generate queries which are more accurate and relevant to your project"
                />
              </div> */}
              {prompts.length === 0 && (
                <div className="space-y-2 mt-4 mb-6">
                  <div className="flex items-center justify-between px-5">
                    <p className="text-sm text-scale-1100">Examples</p>
                  </div>
                  <div className="px-3">
                    {EXAMPLE_QUERIES.map((query, idx) => (
                      <div
                        key={`query_${idx}`}
                        className="flex items-start space-x-3 bg-scale-300 px-2 py-2 rounded-md group hover:bg-scale-500 cursor-pointer"
                        onClick={async () => await onSubmit({ prompt: query }, { resetForm })}
                      >
                        <div>
                          <AiIcon className="text-brand-900 w-5 h-5" />
                        </div>
                        <p className="text-sm text-scale-1100 group-hover:text-scale-1200">
                          {query}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="text-area-text-sm px-5">
                <Input
                  autoFocus
                  id="prompt"
                  name="prompt"
                  disabled={isSubmitting}
                  actions={
                    <div className="flex items-center space-x-2 mr-2">
                      <p className="text-sm text-scale-1100">Submit message</p>
                      <div className="flex items-center justify-center bg-scale-500 p-1 rounded-md border border-scale-700">
                        <IconCornerDownLeft strokeWidth={1.5} size={12} />
                      </div>
                    </div>
                  }
                />
              </div>
            </div>
          )}
        </Form>
      </div>
    </Modal>
  )
}

export default AskSupabaseAIModal
