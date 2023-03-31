import { stripIndent } from 'common-tags'
import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'
import { useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { useState, useEffect, useRef } from 'react'
import {
  Badge,
  Button,
  Form,
  IconChevronDown,
  IconChevronUp,
  IconCornerDownLeft,
  IconUser,
  Input,
  Modal,
} from 'ui'
import { EXAMPLE_QUERIES } from './AskSupabaseAIModal.constants'
import { AiIcon } from './UtilityActions'

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

  const onSubmit = async (values: any, { resetForm }: any) => {
    setPrompts(prompts.concat([values.prompt]))
    scrollToBottom()
    setIsSubmitting(true)

    const tables = (await meta.tables.loadBySchema('public')) as any[]
    const createTableQueries = tables.map((table) => {
      return stripIndent`
        CREATE TABLE "${table.schema}"."${table.name}"
        (
        ${table.columns
          .map(
            (column: any) =>
              `    ${column.name} ${column.data_type} ${!column.is_nullable ? 'NOT NULL' : 'NULL'}`
          )
          .join(',\n')}
        );
      `
    })
    const response = await post('/api/natural-language', {
      query: values.prompt,
      tables: createTableQueries.join('\n'),
    })
    setIsSubmitting(false)

    if (response.error) {
      ui.setNotification({ category: 'error', message: 'Failed to generate SQL' })
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
                      <div className="flex items-center justify-center w-7 h-7 rounded-md border border-brand-400 bg-gradient-to-r from-brand-900 to-brand-800 ring-brand-600 ring-1">
                        <AiIcon className="w-4 h-4" />
                      </div>
                      {output == undefined ? (
                        <div className="w-2 h-4 bg-scale-900 mt-1 animate-bounce" />
                      ) : (
                        <div className="px-4 py-2 bg-scale-400 rounded-md border border-scale-600 flex-grow">
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
        <Form validateOnBlur initialValues={{ prompt: '' }} onSubmit={onSubmit}>
          {({ resetForm }: { resetForm: any }) => (
            <div>
              <div className="flex items-center justify-between px-5 mb-2">
                <p className="text-sm text-scale-1200">
                  Ask us anything, and we will try to generate the relevant SQL statements for you
                </p>
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
              </div>
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
