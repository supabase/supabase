import { Message as MessageType } from 'ai'
import Telemetry from 'lib/telemetry'
import { compact, last } from 'lodash'
import { ChevronsUpDown } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useChat } from 'ai/react'
import { useTelemetryProps } from 'common'
import { SchemaComboBox } from 'components/ui/SchemaComboBox'
import { useEntityDefinitionsQuery } from 'data/database/entity-definitions-query'
import { useSchemasForAi } from 'hooks/misc/useSchemasForAi'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { BASE_PATH } from 'lib/constants'
import { useProfile } from 'lib/profile'
import uuidv4 from 'lib/uuid'
import {
  AiIconAnimation,
  Button,
  cn,
  Tooltip_Shadcn_,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
} from 'ui'
import { AssistantChatForm } from 'ui-patterns'
import { DiffType } from '../SQLEditor.types'
import Message from './Message'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'

export type MessageWithDebug = MessageType & { isDebug: boolean }

interface AiAssistantPanelProps {
  selectedMessage?: string
  existingSql: string
  includeSchemaMetadata: boolean
  onDiff: ({ id, diffType, sql }: { id: string; diffType: DiffType; sql: string }) => void
  onClose: () => void
}

export const AiAssistantPanel = ({
  selectedMessage,
  existingSql,
  onDiff,
  onClose,
  includeSchemaMetadata,
}: AiAssistantPanelProps) => {
  const project = useSelectedProject()
  const selectedOrganization = useSelectedOrganization()

  const [selectedSchemas, setSelectedSchemas] = useSchemasForAi(project?.ref!)

  const { data } = useEntityDefinitionsQuery(
    {
      schemas: selectedSchemas,
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    { enabled: includeSchemaMetadata }
  )

  const entityDefinitions = includeSchemaMetadata ? data?.map((def) => def.sql.trim()) : undefined

  // Use chat id because useChat doesn't have a reset function to clear all messages
  const [chatId, setChatId] = useState(uuidv4())
  const {
    messages: chatMessages,
    append,
    isLoading,
  } = useChat({
    id: chatId,
    api: `${BASE_PATH}/api/ai/sql/generate-v2`,
    body: {
      existingSql: existingSql,
      entityDefinitions: entityDefinitions,
    },
  })

  const messages = useMemo(() => {
    const merged = [...chatMessages.map((m) => ({ ...m, isDebug: false }))]

    return merged.sort(
      (a, b) =>
        (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0) ||
        a.role.localeCompare(b.role)
    )
  }, [chatMessages])

  const router = useRouter()
  const { profile } = useProfile()
  const bottomRef = useRef<HTMLDivElement>(null)
  const telemetryProps = useTelemetryProps()

  const [value, setValue] = useState<string>('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const name = compact([profile?.first_name, profile?.last_name]).join(' ')
  const pendingReply = isLoading && last(messages)?.role === 'user'

  useEffect(() => {
    if (!isLoading) {
      setValue('')
      if (inputRef.current) inputRef.current.focus()
    }

    // Try to scroll on each rerender to the bottom
    setTimeout(
      () => {
        if (bottomRef.current) {
          bottomRef.current.scrollIntoView({ behavior: 'smooth' })
        }
      },
      isLoading ? 100 : 500
    )
  }, [isLoading])

  return (
    <div className="flex flex-col h-full border-l border-control">
      <div
        className={cn(
          'overflow-auto flex-1',
          messages.length === 0 ? 'flex flex-col justify-between' : ''
        )}
      >
        <Message
          key="zero"
          role="assistant"
          content={`Hi${
            name ? ' ' + name : ''
          }, how can I help you? I'm powered by AI, so surprises and mistakes are possible.
        Make sure to verify any generated code or suggestions, and share feedback so that we can
        learn and improve.`}
          action={
            <Button type="default" onClick={onClose}>
              Close Assistant
            </Button>
          }
        >
          <div className="flex flex-row justify-between space-x-2">
            {includeSchemaMetadata ? (
              <SchemaComboBox
                disabled={!includeSchemaMetadata}
                selectedSchemas={selectedSchemas}
                onSelectSchemas={setSelectedSchemas}
                label={
                  includeSchemaMetadata && selectedSchemas.length > 0
                    ? `${selectedSchemas.length} schema${
                        selectedSchemas.length > 1 ? 's' : ''
                      } selected`
                    : 'No schemas selected'
                }
              />
            ) : (
              <ButtonTooltip
                disabled
                size="tiny"
                type="default"
                className="w-min"
                iconRight={<ChevronsUpDown size={14} />}
                tooltip={{
                  content: {
                    side: 'bottom',
                    className: 'w-72',
                    text: (
                      <>
                        Opt in to sending anonymous data to OpenAI in your{' '}
                        <Link
                          className="underline"
                          href={`/org/${selectedOrganization?.slug}/general`}
                        >
                          organization settings
                        </Link>{' '}
                        to share schemas with the Assistant for more accurate responses.
                      </>
                    ),
                  },
                }}
              >
                No schemas selected
              </ButtonTooltip>
            )}
            <Button type="warning" onClick={() => setChatId(uuidv4())}>
              Clear history
            </Button>
          </div>
        </Message>

        {messages.map((m) => (
          <Message
            key={`message-${m.id}`}
            name={m.name}
            role={m.role}
            content={m.content}
            createdAt={new Date(m.createdAt || new Date()).getTime()}
            isDebug={m.isDebug}
            isSelected={selectedMessage === m.id}
            onDiff={(diffType, sql) => onDiff({ id: m.id, diffType, sql })}
          />
        ))}

        {pendingReply && <Message key="thinking" role="assistant" content="Thinking..." />}

        <div ref={bottomRef} className="h-1" />
      </div>

      <div className="sticky p-5 flex-0 border-t">
        <AssistantChatForm
          textAreaRef={inputRef}
          loading={isLoading}
          disabled={isLoading}
          icon={
            <AiIconAnimation
              allowHoverEffect
              className="[&>div>div]:border-black dark:[&>div>div]:border-white"
            />
          }
          placeholder="Ask a question about your SQL query"
          value={value}
          onValueChange={(e) => setValue(e.target.value)}
          onSubmit={(event) => {
            event.preventDefault()
            append({
              content: value,
              role: 'user',
              createdAt: new Date(),
            })
            Telemetry.sendEvent(
              {
                category: 'sql_editor_ai_assistant',
                action: 'ai_suggestion_asked',
                label: 'sql-editor-ai-assistant',
              },
              telemetryProps,
              router
            )
          }}
        />
      </div>
    </div>
  )
}
