import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Message as MessageType } from 'ai'
import { useChat } from 'ai/react'
import Telemetry from 'lib/telemetry'
import { compact, last } from 'lodash'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useParams, useTelemetryProps } from 'common'
import { SchemaComboBox } from 'components/ui/SchemaComboBox'
import { useEntityDefinitionsQuery } from 'data/database/entity-definitions-query'
import { useOrganizationUpdateMutation } from 'data/organizations/organization-update-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useSchemasForAi } from 'hooks/misc/useSchemasForAi'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { BASE_PATH, LOCAL_STORAGE_KEYS, OPT_IN_TAGS } from 'lib/constants'
import { useProfile } from 'lib/profile'
import uuidv4 from 'lib/uuid'
import { Info } from 'lucide-react'
import {
  AiIconAnimation,
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  cn,
  Tooltip_Shadcn_,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  WarningIcon,
} from 'ui'
import { AssistantChatForm } from 'ui-patterns/AssistantChat/AssistantChatForm'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import OptInToOpenAIToggle from '../../Organization/GeneralSettings/OptInToOpenAIToggle'
import { DiffType } from '../SQLEditor.types'
import Message from './Message'

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
  const router = useRouter()
  const { ref } = useParams()
  const { profile } = useProfile()

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

  const selectedOrganization = useSelectedOrganization()

  const [isConfirmOptInModalOpen, setIsConfirmOptInModalOpen] = useState(false)

  const canUpdateOrganization = useCheckPermissions(PermissionAction.UPDATE, 'organizations')

  const { mutate: updateOrganization, isLoading: isUpdating } = useOrganizationUpdateMutation()

  const confirmOptInToShareSchemaData = async () => {
    if (!canUpdateOrganization) {
      return toast.error('You do not have the required permissions to update this organization')
    }

    if (!selectedOrganization?.slug) return console.error('Organization slug is required')

    const existingOptInTags = selectedOrganization?.opt_in_tags ?? []

    const updatedOptInTags = existingOptInTags.includes(OPT_IN_TAGS.AI_SQL)
      ? existingOptInTags
      : [...existingOptInTags, OPT_IN_TAGS.AI_SQL]

    updateOrganization(
      { slug: selectedOrganization?.slug, opt_in_tags: updatedOptInTags },
      {
        onSuccess: () => {
          toast.success('Successfully opted-in')
          setIsConfirmOptInModalOpen(false)
        },
      }
    )
  }

  const [showAiNotOptimizedWarningSetting, setShowAiNotOptimizedWarningSetting] =
    useLocalStorageQuery(LOCAL_STORAGE_KEYS.SHOW_AI_NOT_OPTIMIZED_WARNING(ref as string), true)

  const shouldShowNotOptimizedAlert =
    selectedOrganization && !includeSchemaMetadata && showAiNotOptimizedWarningSetting

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
            <div className="flex gap-2">
              {messages.length > 0 && (
                <Button type="warning" onClick={() => setChatId(uuidv4())}>
                  Clear history
                </Button>
              )}
              <Button type="default" onClick={onClose}>
                Close Assistant
              </Button>
            </div>
          }
        >
          {includeSchemaMetadata ? (
            <div className="mt-2">
              <span className="inline-block text-lighter">
                Include these schemas in your prompts:
              </span>
              <div className="flex flex-row justify-between space-x-2 mt-2">
                <div className="flex items-center gap-2">
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
                  <Tooltip_Shadcn_>
                    <TooltipTrigger_Shadcn_ className="flex items-center gap-2 text-lighter">
                      <Info className="text-lighter w-4 h-4" />
                    </TooltipTrigger_Shadcn_>
                    <TooltipContent_Shadcn_ className="w-72" side="right">
                      Select specific schemas to send with your queries. Supabase AI can use this
                      data to improve the responses it shows you.
                    </TooltipContent_Shadcn_>
                  </Tooltip_Shadcn_>
                </div>
              </div>
            </div>
          ) : (
            <>
              {shouldShowNotOptimizedAlert ? (
                <Alert_Shadcn_ className="[&>svg]:left-5 border-l-0 border-r-0 rounded-none -mx-5 px-5 w-[calc(100%+40px)]">
                  <WarningIcon />
                  <AlertTitle_Shadcn_>AI Assistant is not optimized</AlertTitle_Shadcn_>
                  <AlertDescription_Shadcn_>
                    You need to agree to share anonymous schema data with OpenAI for the best
                    experience.
                  </AlertDescription_Shadcn_>
                  <div className="flex items-center gap-4 mt-6">
                    <Button type="default" onClick={() => setIsConfirmOptInModalOpen(true)}>
                      Update AI settings
                    </Button>

                    <Button type="text" onClick={() => setShowAiNotOptimizedWarningSetting(false)}>
                      Dismiss
                    </Button>
                  </div>
                </Alert_Shadcn_>
              ) : (
                <></>
              )}
            </>
          )}
        </Message>
        {messages.map((m, index) => {
          const isFirstUserMessage =
            m.role === 'user' && messages.slice(0, index).every((msg) => msg.role !== 'user')

          return (
            <Message
              key={`message-${m.id}`}
              name={m.name}
              role={m.role}
              content={m.content}
              createdAt={new Date(m.createdAt || new Date()).getTime()}
              isDebug={m.isDebug}
              isSelected={selectedMessage === m.id}
              onDiff={(diffType, sql) => onDiff({ id: m.id, diffType, sql })}
            >
              {isFirstUserMessage && !includeSchemaMetadata && !shouldShowNotOptimizedAlert && (
                <Alert_Shadcn_>
                  <AlertDescription_Shadcn_ className="flex flex-col gap-4">
                    <span>
                      Quick reminder that you're not sending project metadata with your queries. By
                      opting into sending anonymous data, Supabase AI can improve the answers it
                      shows you.
                    </span>
                    <Button
                      type="default"
                      className="w-fit"
                      onClick={() => setIsConfirmOptInModalOpen(true)}
                    >
                      Update AI settings
                    </Button>
                  </AlertDescription_Shadcn_>
                </Alert_Shadcn_>
              )}
              {isFirstUserMessage && includeSchemaMetadata && selectedSchemas.length === 0 && (
                <Alert_Shadcn_>
                  <AlertDescription_Shadcn_ className="flex flex-col gap-4">
                    <span>
                      We recommend including the schemas for better answers by Supabase AI.
                    </span>
                  </AlertDescription_Shadcn_>
                </Alert_Shadcn_>
              )}
            </Message>
          )
        })}
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
      <ConfirmationModal
        visible={isConfirmOptInModalOpen}
        size="large"
        title="Confirm sending anonymous data to OpenAI"
        confirmLabel="Confirm"
        onCancel={() => setIsConfirmOptInModalOpen(false)}
        onConfirm={confirmOptInToShareSchemaData}
        loading={isUpdating}
      >
        <p className="text-sm text-foreground-light">
          By opting into sending anonymous data, Supabase AI can improve the answers it shows you.
          This is an organization-wide setting, and affects all projects in your organization.
        </p>

        <OptInToOpenAIToggle />
      </ConfirmationModal>
    </div>
  )
}
