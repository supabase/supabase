import { Message as VercelMessage } from 'ai/react'
import { Loader2, User } from 'lucide-react'
import { createContext, PropsWithChildren, ReactNode, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import { Components } from 'react-markdown/lib/ast-to-react'
import remarkGfm from 'remark-gfm'

import { ProfileImage } from 'components/ui/ProfileImage'
import { useProfile } from 'lib/profile'
import { cn, markdownComponents, WarningIcon } from 'ui'
import { EdgeFunctionBlock } from '../EdgeFunctionBlock/EdgeFunctionBlock'
import { DisplayBlockRenderer } from './DisplayBlockRenderer'
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
}

export const Message = function Message({
  id,
  message,
  isLoading,
  readOnly,
  action = null,
  variant = 'default',
  onResults,
}: PropsWithChildren<MessageProps>) {
  const { profile } = useProfile()
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

  const { role, content, parts } = message
  const isUser = role === 'user'

  const shouldUsePartsRendering = parts && parts.length > 0

  const hasTextContent = content && content.trim().length > 0

  return (
    <MessageContext.Provider value={{ isLoading, readOnly }}>
      <div
        className={cn(
          'text-foreground-light text-sm',
          isUser && 'text-foreground',
          variant === 'warning' && 'bg-warning-200'
        )}
      >
        {variant === 'warning' && <WarningIcon className="w-6 h-6" />}

        {action}

        <div className="flex gap-4 w-auto overflow-hidden">
          {isUser && (
            <ProfileImage
              alt={profile?.username}
              src={profile?.profileImageUrl}
              className="w-5 h-5 shrink-0 rounded-full"
            />
          )}

          <div className="flex-1 min-w-0 space-y-2">
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
                              isUser && 'text-foreground [&>p]:font-medium'
                            )}
                            remarkPlugins={[remarkGfm]}
                            components={allMarkdownComponents}
                          >
                            {part.text}
                          </ReactMarkdown>
                        )

                      case 'tool-invocation': {
                        const { toolCallId, toolName, args, state } = part.toolInvocation
                        if (state === 'call' || state === 'partial-call') {
                          if (shownLoadingTools.has(toolName)) {
                            return null
                          }
                          shownLoadingTools.add(toolName)
                          return (
                            <div
                              key={`${id}-tool-loading-${toolName}`}
                              className="rounded-lg border bg-surface-75 text-xs font-mono text-xs text-foreground-lighter py-2 px-3 flex items-center gap-2"
                            >
                              <Loader2 className="w-4 h-4 animate-spin" />
                              {`Calling ${toolName}...`}
                            </div>
                          )
                        }
                        // Only render the result UI for known tools when state is 'result'
                        switch (toolName) {
                          case 'display_query': {
                            return (
                              <DisplayBlockRenderer
                                key={`${id}-tool-${toolCallId}`}
                                messageId={id}
                                toolCallId={toolCallId}
                                manualId={args.manualToolCallId}
                                initialArgs={args}
                                messageParts={parts}
                                isLoading={false}
                                onResults={onResults}
                              />
                            )
                          }
                          case 'display_edge_function': {
                            return (
                              <div
                                key={`${id}-tool-${toolCallId}`}
                                className="w-auto overflow-x-hidden"
                              >
                                <EdgeFunctionBlock
                                  label={args.name || 'Edge Function'}
                                  code={args.code}
                                  functionName={args.name || 'my-function'}
                                  showCode={!readOnly}
                                />
                              </div>
                            )
                          }
                          default:
                            // For unknown tools, just show nothing for result
                            return null
                        }
                      }
                      case 'reasoning':
                      case 'source':
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
      </div>
    </MessageContext.Provider>
  )
}
