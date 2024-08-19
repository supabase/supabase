import Telemetry from 'lib/telemetry'
import { compact, last } from 'lodash'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'

import { useTelemetryProps } from 'common'
import { SchemaComboBox } from 'components/ui/SchemaComboBox'
import { useOrgOptedIntoAi } from 'hooks/misc/useOrgOptedIntoAi'
import { useSchemasForAi } from 'hooks/misc/useSchemasForAi'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { IS_PLATFORM } from 'lib/constants'
import { useProfile } from 'lib/profile'
import { ChevronsUpDown } from 'lucide-react'
import Link from 'next/link'
import {
  AiIconAnimation,
  Button,
  Tooltip_Shadcn_,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
} from 'ui'
import { AssistantChatForm } from 'ui-patterns'
import { MessageWithDebug } from './AIPolicyEditorPanel.utils'
import Message from './Message'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'

interface AIPolicyChatProps {
  messages: MessageWithDebug[]
  selectedMessage?: string
  loading: boolean
  onSubmit: (s: string) => void
  onDiff: (message: { id: string; content: string }) => void
}

export const AIPolicyChat = ({
  messages,
  selectedMessage,
  loading,
  onSubmit,
  onDiff,
}: AIPolicyChatProps) => {
  const router = useRouter()
  const project = useSelectedProject()
  const selectedOrganization = useSelectedOrganization()
  const { profile } = useProfile()
  const bottomRef = useRef<HTMLDivElement>(null)
  const telemetryProps = useTelemetryProps()

  const [selectedSchemas, setSelectedSchemas] = useSchemasForAi(project?.ref!)
  const [value, setValue] = useState<string>('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const isOptedInToAI = useOrgOptedIntoAi()
  const includeSchemaMetadata = isOptedInToAI || !IS_PLATFORM

  const name = compact([profile?.first_name, profile?.last_name]).join(' ')
  const pendingReply = loading && last(messages)?.role === 'user'

  useEffect(() => {
    if (!loading) {
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
      loading ? 100 : 500
    )
  }, [loading])

  return (
    <div id={'ai-chat-assistant'} className="flex flex-col h-full max-w-full">
      <div className="overflow-auto flex-1 divide-y divide-border">
        <Message
          key="zero"
          role="assistant"
          content={`Hi${
            name ? ' ' + name : ''
          }, I can help you to write RLS policies. I'm powered by AI, so surprises and mistakes are possible.
        Make sure to verify any generated code or suggestions, and share feedback so that we can
        learn and improve.`}
        >
          {includeSchemaMetadata ? (
            <SchemaComboBox
              className="w-fit"
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
        </Message>

        {messages.map((m) => (
          <Message
            key={`message-${m.id}`}
            name={m.name}
            role={m.role}
            content={m.content}
            createdAt={new Date(m.createdAt || new Date()).getTime()}
            isDebug={m.isDebug}
            isSelected={m.id === selectedMessage}
            onDiff={(content) => onDiff({ id: m.id, content })}
          />
        ))}

        {pendingReply && <Message key="thinking" role="assistant" content="Thinking..." />}

        <div ref={bottomRef} className="h-1" />
      </div>

      <div className="sticky p-5 flex-0 border-t">
        <AssistantChatForm
          textAreaRef={inputRef}
          loading={loading}
          disabled={loading}
          icon={
            <AiIconAnimation
              allowHoverEffect
              className="[&>div>div]:border-black dark:[&>div>div]:border-white"
            />
          }
          placeholder="Ask for some changes to your policy"
          value={value}
          onValueChange={(e) => setValue(e.target.value)}
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit(value)
            Telemetry.sendEvent(
              {
                category: 'rls_editor',
                action: 'ai_suggestion_asked',
                label: 'rls-ai-assistant',
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
