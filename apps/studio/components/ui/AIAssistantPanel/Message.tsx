import { UIMessage as VercelMessage } from '@ai-sdk/react'
import { CheckIcon, Loader2, Pencil, Trash2 } from 'lucide-react'
import { createContext, memo, PropsWithChildren, ReactNode, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Components } from 'react-markdown/lib/ast-to-react'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'

import { ProfileImage } from 'components/ui/ProfileImage'
import { useProfile } from 'lib/profile'
import { cn, markdownComponents, WarningIcon } from 'ui'
import { ButtonTooltip } from '../ButtonTooltip'
import { EdgeFunctionRenderer } from './EdgeFunctionRenderer'
import { DeleteMessageConfirmModal } from './DeleteMessageConfirmModal'
import { DisplayBlockRenderer } from './DisplayBlockRenderer'

import {
  Heading3,
  Hyperlink,
  InlineCode,
  ListItem,
  MarkdownPre,
  OrderedList,
} from './MessageMarkdown'
import { Reasoning } from './elements/Reasoning'
import type { AssistantMessageType } from 'state/ai-assistant-state'

interface MessageContextType {
  isLoading: boolean
  readOnly?: boolean
}
export const MessageContext = createContext<MessageContextType>({ isLoading: false })

const baseMarkdownComponents: Partial<Components> = {
  ol: OrderedList,
  li: ListItem,
  h3: Heading3,
  code: InlineCode,
  a: Hyperlink,
  img: ({ src }) => <span className="text-foreground-light font-mono">[Image: {src}]</span>,
}

interface MessageProps {
  id: string
  message: VercelMessage
  isLoading: boolean
  readOnly?: boolean
  action?: ReactNode
  variant?: 'default' | 'warning'
  onResults: (message: VercelMessage) => void
  addToolResult?: (args: { tool: string; toolCallId: string; output: unknown }) => Promise<void>
  onDelete: (id: string) => void
  onEdit: (id: string) => void
  isAfterEditedMessage: boolean
  isBeingEdited: boolean
  onCancelEdit: () => void
  isLastMessage?: boolean
}

export const Message = function Message({
  id,
  message,
  isLoading,
  readOnly,
  action = null,
  variant = 'default',
  onResults,
  addToolResult,
  onDelete,
  onEdit,
  isAfterEditedMessage = false,
  isBeingEdited = false,
  onCancelEdit,
  isLastMessage = false,
}: PropsWithChildren<MessageProps>) {
  const { profile } = useProfile()
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const allMarkdownComponents: Partial<Components> = useMemo(
    () => ({
      ...markdownComponents,
      ...baseMarkdownComponents,
      pre: ({ children }) => (
        <MarkdownPre
          id={id}
          onResults={(args: { messageId: string; resultId?: string; results: any[] }) => {
            const updatedMessage: AssistantMessageType = {
              ...(message as AssistantMessageType),
              results: {
                ...((message as AssistantMessageType).results ?? {}),
                [args.resultId ?? 'default']: args.results as any[],
              },
            }
            onResults(updatedMessage)
          }}
        >
          {children}
        </MarkdownPre>
      ),
    }),
    [id, onResults, message]
  )

  if (!message) {
    console.error(`Message component received undefined message prop for id: ${id}`)
    return null
  }

  // For backwards compatibility: some stored messages may have a 'content' property
  const { role, parts } = message
  const hasContent = (msg: VercelMessage): msg is VercelMessage & { content: string } =>
    'content' in msg && typeof msg.content === 'string'
  const content = hasContent(message) ? message.content : undefined
  const isUser = role === 'user'

  const shouldUsePartsRendering = parts && parts.length > 0

  const hasTextContent = content && content.trim().length > 0

  return (
    <MessageContext.Provider value={{ isLoading, readOnly }}>
      <div
        className={cn(
          'group text-foreground-light text-sm first:mt-0',
          isUser ? 'text-foreground mt-6' : '',
          variant === 'warning' && 'bg-warning-200',
          isAfterEditedMessage && 'opacity-50 cursor-pointer transition-opacity'
        )}
        onClick={isAfterEditedMessage ? onCancelEdit : undefined}
      >
        {variant === 'warning' && <WarningIcon className="w-6 h-6" />}

        {action}

        <div className="flex gap-4 w-auto overflow-hidden group">
          {isUser && (
            <ProfileImage
              alt={profile?.username}
              src={profile?.profileImageUrl}
              className="w-5 h-5 shrink-0 rounded-full translate-y-0.5"
            />
          )}

          <div className="flex-1 min-w-0">
            {shouldUsePartsRendering ? (
              (() => {
                return parts.map(
                  (part: NonNullable<VercelMessage['parts']>[number], index: number) => {
                    const isLastPart = index === parts.length - 1
                    switch (part.type) {
                      case 'dynamic-tool': {
                        return (
                          <div
                            key={`${id}-tool-${part.toolCallId}`}
                            className={cn(
                              'tool-item text-foreground-lighter flex items-center gap-2 py-2',
                              '[&:not(.tool-item+.tool-item)]:mt-4 [&:not(:has(+.tool-item))]:mb-4',
                              '[&:has(+.tool-item)]:border-b [&:has(+.tool-item)]:border-b-muted',
                              'first:!mt-0 last:mb-0'
                            )}
                          >
                            {part.state === 'input-streaming' ? (
                              <Loader2 strokeWidth={1.5} size={12} className="animate-spin" />
                            ) : (
                              <CheckIcon
                                strokeWidth={1.5}
                                size={12}
                                className="text-foreground-muted"
                              />
                            )}
                            <div>
                              {part.state === 'input-streaming' ? 'Running ' : 'Ran '}
                              <span className="text-foreground-lighter">{`${part.toolName}`}</span>
                            </div>
                          </div>
                        )
                      }
                      case 'reasoning':
                        return (
                          <Reasoning
                            key={`${message.id}-${index}}`}
                            showReasoning={!!part.text}
                            className={cn(
                              'w-full dynamic-tool-item',
                              '[&:not(.dynamic-tool-item+.dynamic-tool-item)]:mt-4 [&.dynamic-tool-item+.dynamic-tool-item]:mt-1 first:!mt-0',
                              '[&:not(:has(+.dynamic-tool-item))]:mb-4'
                            )}
                            isStreaming={part.state === 'streaming'}
                          >
                            {part.text || part.text}
                          </Reasoning>
                        )
                      case 'text':
                        return (
                          <ReactMarkdown
                            key={`${id}-part-${index}`}
                            className={cn(
                              'max-w-none space-y-4 prose prose-sm prose-li:mt-1 [&>div]:my-4 prose-h1:text-xl prose-h1:mt-6 prose-h2:text-lg prose-h3:no-underline prose-h3:text-base prose-h3:mb-4 prose-strong:font-medium prose-strong:text-foreground prose-ol:space-y-3 prose-ul:space-y-3 prose-li:my-0 break-words [&>p:not(:last-child)]:!mb-2 [&>*>p:first-child]:!mt-0 [&>*>p:last-child]:!mb-0 [&>*>*>p:first-child]:!mt-0 [&>*>*>p:last-child]:!mb-0 [&>ol>li]:!pl-4',
                              isUser && 'text-foreground [&>p]:font-medium',
                              isBeingEdited && 'animate-pulse'
                            )}
                            remarkPlugins={[remarkGfm]}
                            components={allMarkdownComponents}
                          >
                            {part.text}
                          </ReactMarkdown>
                        )

                      case 'tool-execute_sql': {
                        const { toolCallId, state, input, output } = part

                        if (state === 'input-streaming') {
                          return (
                            <div
                              key={`${id}-tool-loading-execute_sql`}
                              className="my-4 rounded-lg border bg-surface-75 heading-meta h-9 px-3 text-foreground-light flex items-center gap-2"
                            >
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Writing SQL...
                            </div>
                          )
                        }

                        if (state === 'input-available' || state === 'output-available') {
                          return (
                            <div
                              key={`${id}-tool-${toolCallId}`}
                              className="w-auto overflow-x-hidden my-4 space-y-2"
                            >
                              <DisplayBlockRenderer
                                messageId={id}
                                toolCallId={toolCallId}
                                initialArgs={{
                                  sql: (input as any).sql,
                                  label: (input as any).label,
                                  isWriteQuery: (input as any).isWriteQuery,
                                }}
                                results={output}
                                toolState={state}
                                isLastPart={isLastPart}
                                isLastMessage={isLastMessage}
                                onResults={async (args: {
                                  messageId: string
                                  resultId?: string
                                  results: unknown
                                }) => {
                                  const results = args.results as any[]

                                  await addToolResult?.({
                                    tool: 'execute_sql',
                                    toolCallId: String(toolCallId),
                                    output: results,
                                  })
                                }}
                                onError={async ({ errorText }) => {
                                  await addToolResult?.({
                                    tool: 'execute_sql',
                                    toolCallId: String(toolCallId),
                                    output: `Error: ${errorText}`,
                                  })
                                  onResults(message)
                                }}
                              />
                            </div>
                          )
                        }
                        if (state === 'output-error') {
                          return (
                            <div key={`${id}-tool-${toolCallId}`} className="text-xs text-danger">
                              Failed to execute SQL.
                            </div>
                          )
                        }
                        return null
                      }
                      case 'tool-deploy_edge_function': {
                        const { toolCallId, state, input } = part
                        if (state === 'input-streaming') {
                          return (
                            <div
                              key={`${id}-tool-loading-deploy_edge_function`}
                              className="my-4 rounded-lg border bg-surface-75 font-mono text-xs text-foreground-lighter py-2 px-3 flex items-center gap-2"
                            >
                              <Loader2 className="w-4 h-4 animate-spin" />
                              {`Preparing Edge Function deployment...`}
                            </div>
                          )
                        }
                        if (state === 'input-available' || state === 'output-available') {
                          return (
                            <EdgeFunctionRenderer
                              key={`${id}-tool-${toolCallId}`}
                              label={(input as any).name || 'Edge Function'}
                              code={(input as any).code}
                              functionName={(input as any).name || 'my-function'}
                              onDeployed={async (res) => {
                                if (res.success) {
                                  await addToolResult?.({
                                    tool: 'deploy_edge_function',
                                    toolCallId: String(toolCallId),
                                    output: 'Deployed successfully',
                                  })
                                  onResults(message)
                                } else {
                                  await addToolResult?.({
                                    tool: 'deploy_edge_function',
                                    toolCallId: String(toolCallId),
                                    output: res.errorText,
                                  })
                                  onResults(message)
                                }
                              }}
                            />
                          )
                        }
                        if (state === 'output-error') {
                          return (
                            <div key={`${id}-tool-${toolCallId}`} className="text-xs text-danger">
                              Failed to deploy Edge Function.
                            </div>
                          )
                        }
                        return null
                      }

                      case 'source-url':
                      case 'source-document':
                      case 'file':
                        return null
                      default:
                        return null
                    }
                  }
                )
              })()
            ) : hasTextContent ? (
              <ReactMarkdown
                className="prose prose-sm max-w-none break-words"
                remarkPlugins={[remarkGfm]}
                components={allMarkdownComponents}
              >
                {content}
              </ReactMarkdown>
            ) : (
              <span className="text-foreground-lighter italic">Assistant is thinking...</span>
            )}
          </div>
        </div>
        {message.role === 'user' && (
          <div className="flex items-center gap-4 mt-2 mb-1">
            <span className="h-0.5 w-5 bg-muted" />
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <>
                <ButtonTooltip
                  type="text"
                  icon={<Pencil size={14} strokeWidth={1.5} />}
                  onClick={isBeingEdited || isAfterEditedMessage ? onCancelEdit : () => onEdit(id)}
                  className="text-foreground-light hover:text-foreground p-1 rounded"
                  aria-label={
                    isBeingEdited || isAfterEditedMessage ? 'Cancel editing' : 'Edit message'
                  }
                  tooltip={{
                    content: {
                      side: 'bottom',
                      text:
                        isBeingEdited || isAfterEditedMessage ? 'Cancel editing' : 'Edit message',
                    },
                  }}
                />

                <ButtonTooltip
                  type="text"
                  icon={<Trash2 size={14} strokeWidth={1.5} />}
                  tooltip={{ content: { side: 'bottom', text: 'Delete message' } }}
                  onClick={() => setShowDeleteConfirmModal(true)}
                  className="text-foreground-light hover:text-foreground p-1 rounded"
                  title="Delete message"
                  aria-label="Delete message"
                />
              </>
            </div>
          </div>
        )}
      </div>

      <DeleteMessageConfirmModal
        visible={showDeleteConfirmModal}
        onConfirm={() => {
          onDelete(id)
          setShowDeleteConfirmModal(false)
          toast.success('Message deleted successfully')
        }}
        onCancel={() => setShowDeleteConfirmModal(false)}
      />
    </MessageContext.Provider>
  )
}
