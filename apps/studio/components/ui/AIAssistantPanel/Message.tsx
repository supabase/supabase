import { UIMessage as VercelMessage } from '@ai-sdk/react'
import { Loader2, Pencil, Trash2 } from 'lucide-react'
import { createContext, PropsWithChildren, ReactNode, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Components } from 'react-markdown/lib/ast-to-react'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'

import { ProfileImage } from 'components/ui/ProfileImage'
import { useProfile } from 'lib/profile'
import { cn, markdownComponents, WarningIcon } from 'ui'
import { ButtonTooltip } from '../ButtonTooltip'
import { EdgeFunctionBlock } from '../EdgeFunctionBlock/EdgeFunctionBlock'
import { DisplayBlockRenderer } from './DisplayBlockRenderer'
import { DeleteMessageConfirmModal } from './DeleteMessageConfirmModal'
import {
  Heading3,
  Hyperlink,
  InlineCode,
  ListItem,
  MarkdownPre,
  OrderedList,
} from './MessageMarkdown'

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
  onResults: ({
    messageId,
    resultId,
    results,
  }: {
    messageId: string
    resultId?: string
    results: any[]
  }) => void
  onDelete: (id: string) => void
  onEdit: (id: string) => void
  isAfterEditedMessage: boolean
  isBeingEdited: boolean
  onCancelEdit: () => void
}

export const Message = function Message({
  id,
  message,
  isLoading,
  readOnly,
  action = null,
  variant = 'default',
  onResults,
  onDelete,
  onEdit,
  isAfterEditedMessage = false,
  isBeingEdited = false,
  onCancelEdit,
}: PropsWithChildren<MessageProps>) {
  const { profile } = useProfile()
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const allMarkdownComponents: Partial<Components> = useMemo(
    () => ({
      ...markdownComponents,
      ...baseMarkdownComponents,
      pre: ({ children }) => (
        <MarkdownPre id={id} onResults={onResults}>
          {children}
        </MarkdownPre>
      ),
    }),
    [id, onResults]
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
          'text-foreground-light text-sm first:mt-0',
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
              className="w-5 h-5 shrink-0 rounded-full"
            />
          )}

          <div className="flex-1 min-w-0 [&>div:first-child]:!mt-1">
            {shouldUsePartsRendering ? (
              (() => {
                const shownLoadingTools = new Set<string>()
                return parts.map(
                  (part: NonNullable<VercelMessage['parts']>[number], index: number) => {
                    switch (part.type) {
                      case 'text':
                        return (
                          <ReactMarkdown
                            key={`${id}-part-${index}`}
                            className={cn(
                              'prose prose-sm [&>div]:my-4 prose-h1:text-xl prose-h1:mt-6 prose-h3:no-underline prose-h3:text-base prose-h3:mb-4 prose-strong:font-medium prose-strong:text-foreground break-words [&>p:not(:last-child)]:!mb-2 [&>*>p:first-child]:!mt-0 [&>*>p:last-child]:!mb-0 [&>*>*>p:first-child]:!mt-0 [&>*>*>p:last-child]:!mb-0 [&>ol>li]:!pl-4',
                              isUser && 'text-foreground [&>p]:font-medium',
                              isBeingEdited && 'animate-pulse'
                            )}
                            remarkPlugins={[remarkGfm]}
                            components={allMarkdownComponents}
                          >
                            {part.text}
                          </ReactMarkdown>
                        )

                      case 'tool-display_query': {
                        const { toolCallId, state, input } = part
                        if (state === 'input-streaming' || state === 'input-available') {
                          if (shownLoadingTools.has('display_query')) {
                            return null
                          }
                          shownLoadingTools.add('display_query')
                          return (
                            <div
                              key={`${id}-tool-loading-display_query`}
                              className="rounded-lg border bg-surface-75 font-mono text-xs text-foreground-lighter py-2 px-3 flex items-center gap-2"
                            >
                              <Loader2 className="w-4 h-4 animate-spin" />
                              {`Calling display_query...`}
                            </div>
                          )
                        }
                        if (state === 'output-available') {
                          return (
                            <DisplayBlockRenderer
                              key={`${id}-tool-${toolCallId}`}
                              messageId={id}
                              toolCallId={toolCallId}
                              manualId={(input as any).manualToolCallId}
                              initialArgs={input as any}
                              messageParts={parts}
                              isLoading={false}
                              onResults={onResults}
                            />
                          )
                        }
                        return null
                      }
                      case 'tool-display_edge_function': {
                        const { toolCallId, state, input } = part
                        if (state === 'input-streaming' || state === 'input-available') {
                          if (shownLoadingTools.has('display_edge_function')) {
                            return null
                          }
                          shownLoadingTools.add('display_edge_function')
                          return (
                            <div
                              key={`${id}-tool-loading-display_edge_function`}
                              className="rounded-lg border bg-surface-75 font-mono text-xs text-foreground-lighter py-2 px-3 flex items-center gap-2"
                            >
                              <Loader2 className="w-4 h-4 animate-spin" />
                              {`Calling display_edge_function...`}
                            </div>
                          )
                        }
                        if (state === 'output-available') {
                          return (
                            <div
                              key={`${id}-tool-${toolCallId}`}
                              className="w-auto overflow-x-hidden"
                            >
                              <EdgeFunctionBlock
                                label={(input as any).name || 'Edge Function'}
                                code={(input as any).code}
                                functionName={(input as any).name || 'my-function'}
                                showCode={!readOnly}
                              />
                            </div>
                          )
                        }
                        return null
                      }
                      case 'reasoning':
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

            {/* Action buttons - only show for user messages on hover */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              {message.role === 'user' && (
                <>
                  <ButtonTooltip
                    type="text"
                    icon={<Pencil size={14} strokeWidth={1.5} />}
                    onClick={
                      isBeingEdited || isAfterEditedMessage ? onCancelEdit : () => onEdit(id)
                    }
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
              )}
            </div>
          </div>
        </div>
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
