import { UIMessage as VercelMessage } from '@ai-sdk/react'
import { type DynamicToolUIPart, type ToolUIPart, type ReasoningUIPart } from 'ai'
import { BrainIcon, CheckIcon, Loader2, Pencil, Trash2 } from 'lucide-react'
import { type FunctionComponent, PropsWithChildren, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Components } from 'react-markdown/lib/ast-to-react'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'

import { ProfileImage as ProfileImageDisplay } from 'components/ui/ProfileImage'
import { cn, markdownComponents } from 'ui'
import { ButtonTooltip } from '../ButtonTooltip'
import { DeleteMessageConfirmModal } from './DeleteMessageConfirmModal'
import { DisplayBlockRenderer } from './DisplayBlockRenderer'
import { EdgeFunctionRenderer } from './EdgeFunctionRenderer'
import { Tool } from './elements/Tool'
import {
  Heading3,
  Hyperlink,
  InlineCode,
  ListItem,
  MarkdownPre,
  OrderedList,
} from './MessageMarkdown'
import { useProfileNameAndPicture } from './Message.hooks'
import { parseExecuteSqlChartResult } from './Message.utils'

function MessageDisplayProfileImage() {
  const { username, avatarUrl } = useProfileNameAndPicture()
  return (
    <ProfileImageDisplay
      alt={username}
      src={avatarUrl}
      className="w-5 h-5 shrink-0 rounded-full translate-y-0.5"
    />
  )
}
MessageDisplay.ProfileImage = MessageDisplayProfileImage

const baseMarkdownComponents: Partial<Components> = {
  ol: OrderedList,
  li: ListItem,
  h3: Heading3,
  code: InlineCode,
  a: Hyperlink,
  img: ({ src }) => <span className="text-foreground-light font-mono">[Image: {src}]</span>,
}

function MessageDisplayMarkdown({
  id,
  isLoading,
  readOnly,
  className,
  children,
}: PropsWithChildren<{
  id: string
  isLoading: boolean
  readOnly?: boolean
  className?: string
}>) {
  const markdownSource = useMemo(() => {
    if (typeof children === 'string') {
      return children
    }

    if (Array.isArray(children)) {
      return children.filter((child): child is string => typeof child === 'string').join('')
    }

    return ''
  }, [children])

  const allMarkdownComponents: Partial<Components> = useMemo(
    () => ({
      ...markdownComponents,
      ...baseMarkdownComponents,
      pre: ({ children }) => (
        <MarkdownPre id={id} isLoading={isLoading} readOnly={readOnly}>
          {children}
        </MarkdownPre>
      ),
    }),
    [id, isLoading, readOnly]
  )

  return (
    <ReactMarkdown
      className={className}
      remarkPlugins={[remarkGfm]}
      components={allMarkdownComponents}
    >
      {markdownSource}
    </ReactMarkdown>
  )
}
MessageDisplay.Markdown = MessageDisplayMarkdown

function MessageDisplayContainer({
  children,
  onClick,
  className,
}: PropsWithChildren<{ onClick?: () => void; className?: string }>) {
  return (
    <div
      className={cn('group text-foreground-light text-sm first:mt-0', className)}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
MessageDisplay.Container = MessageDisplayContainer

function MessageMainArea({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <div className={cn('flex gap-4 w-auto overflow-hidden group', className)}>{children}</div>
}
MessageDisplay.MainArea = MessageMainArea

function MessageDisplayTextMessage({
  id,
  isLoading,
  readOnly,
  children,
}: PropsWithChildren<{ id: string; isLoading: boolean; readOnly?: boolean }>) {
  return (
    <MessageDisplay.Markdown
      id={id}
      isLoading={isLoading}
      readOnly={readOnly}
      className="prose prose-sm max-w-none break-words"
    >
      {children}
    </MessageDisplay.Markdown>
  )
}
MessageDisplay.TextMessage = MessageDisplayTextMessage

function ToolDisplayDynamic({ toolPart }: { toolPart: DynamicToolUIPart }) {
  return (
    <Tool
      icon={
        toolPart.state === 'input-streaming' ? (
          <Loader2 strokeWidth={1.5} size={12} className="animate-spin" />
        ) : (
          <CheckIcon strokeWidth={1.5} size={12} className="text-foreground-muted" />
        )
      }
      label={
        <div>
          {toolPart.state === 'input-streaming' ? 'Running ' : 'Ran '}
          <span className="text-foreground-lighter">{`${toolPart.toolName}`}</span>
        </div>
      }
    />
  )
}

function ToolDisplayBasicTool({ toolPart }: { toolPart: ToolUIPart }) {
  return (
    <Tool
      icon={
        toolPart.state === 'input-streaming' ? (
          <Loader2 strokeWidth={1.5} size={12} className="animate-spin" />
        ) : (
          <CheckIcon strokeWidth={1.5} size={12} className="text-foreground-muted" />
        )
      }
      label={
        <div>
          {toolPart.state === 'input-streaming' ? 'Running ' : 'Ran '}
          <span className="text-foreground-lighter">{`${toolPart.type.replace('tool-', '')}`}</span>
        </div>
      }
    />
  )
}

function ToolDisplayReasoning({ reasoningPart }: { reasoningPart: ReasoningUIPart }) {
  return (
    <Tool
      icon={
        reasoningPart.state === 'streaming' ? (
          <Loader2 strokeWidth={1.5} size={12} className="animate-spin" />
        ) : (
          <BrainIcon strokeWidth={1.5} size={12} className="text-foreground-muted" />
        )
      }
      label={reasoningPart.state === 'streaming' ? 'Thinking...' : 'Reasoned'}
    >
      {reasoningPart.text}
    </Tool>
  )
}

function ToolDisplayExecuteSqlLoading() {
  return (
    <div className="my-4 rounded-lg border bg-surface-75 heading-meta h-9 px-3 text-foreground-light flex items-center gap-2">
      <Loader2 className="w-4 h-4 animate-spin" />
      Writing SQL...
    </div>
  )
}

function ToolDisplayExecuteSqlFailure() {
  return <div className="text-xs text-danger">Failed to execute SQL.</div>
}

function ToolDisplayExecuteSql({
  id,
  toolPart,
  isLastPart,
  isLastMessage,
  addToolResult,
}: {
  id: string
  toolPart: ToolUIPart
  isLastPart?: boolean
  isLastMessage?: boolean
  addToolResult?: ({
    tool,
    toolCallId,
    output,
  }: {
    tool: string
    toolCallId: string
    output: unknown
  }) => void
}) {
  const { toolCallId, state, input, output } = toolPart

  if (state === 'input-streaming') {
    return <ToolDisplayExecuteSqlLoading />
  }

  if (state === 'output-error') {
    return <ToolDisplayExecuteSqlFailure />
  }

  const { data: chart, success } = parseExecuteSqlChartResult(input)
  if (!success) return null

  if (state === 'input-available' || state === 'output-available') {
    return (
      <div className="w-auto overflow-x-hidden my-4 space-y-2">
        <DisplayBlockRenderer
          messageId={id}
          toolCallId={toolCallId}
          initialArgs={{
            sql: chart.sql,
            label: chart.label,
            isWriteQuery: chart.isWriteQuery,
            view: chart.view,
            xAxis: chart.xAxis,
            yAxis: chart.yAxis,
          }}
          initialResults={output}
          toolState={state}
          isLastPart={isLastPart}
          isLastMessage={isLastMessage}
          onResults={(args: { messageId: string; results: unknown }) => {
            const results = args.results as any[]

            addToolResult?.({
              tool: 'execute_sql',
              toolCallId: String(toolCallId),
              output: results,
            })
          }}
          onError={({ errorText }) => {
            addToolResult?.({
              tool: 'execute_sql',
              toolCallId: String(toolCallId),
              output: `Error: ${errorText}`,
            })
          }}
        />
      </div>
    )
  }

  return null
}

const ToolDisplay = {
  Dynamic: ToolDisplayDynamic,
  BasicTool: ToolDisplayBasicTool,
  Reasoning: ToolDisplayReasoning,
  ExecuteSql: ToolDisplayExecuteSql,
} as const

interface MessageProps {
  id: string
  message: VercelMessage
  isLoading: boolean
  readOnly?: boolean
  variant?: 'default' | 'warning'
  addToolResult?: (args: { tool: string; toolCallId: string; output: unknown }) => Promise<void>
  onDelete: (id: string) => void
  onEdit: (id: string) => void
  isAfterEditedMessage: boolean
  isBeingEdited: boolean
  onCancelEdit: () => void
  isLastMessage?: boolean
}

function MessageDisplay({
  id,
  message,
  isLoading,
  readOnly,
  variant = 'default',
  addToolResult,
  onDelete,
  onEdit,
  isAfterEditedMessage = false,
  isBeingEdited = false,
  onCancelEdit,
  isLastMessage = false,
}: PropsWithChildren<MessageProps>) {
  // For backwards compatibility: some stored messages may have a 'content' property
  const { role, parts } = message
  const hasContent = (msg: VercelMessage): msg is VercelMessage & { content: string } =>
    'content' in msg && typeof msg.content === 'string'
  const content = hasContent(message) ? message.content : undefined
  const isUser = role === 'user'

  const shouldUsePartsRendering = parts && parts.length > 0

  const hasTextContent = content && content.trim().length > 0

  return (
    <MessageDisplayContainer
      className={cn(
        isUser ? 'text-foreground mt-6' : '',
        variant === 'warning' && 'bg-warning-200',
        isAfterEditedMessage && 'opacity-50 cursor-pointer transition-opacity'
      )}
      onClick={isAfterEditedMessage ? onCancelEdit : undefined}
    >
      <MessageMainArea>
        {isUser && <MessageDisplayProfileImage />}

        <div className="flex-1 min-w-0">
          {shouldUsePartsRendering
            ? (() => {
                return parts.map(
                  (part: NonNullable<VercelMessage['parts']>[number], index: number) => {
                    const isLastPart = index === parts.length - 1
                    switch (part.type) {
                      case 'dynamic-tool': {
                        return (
                          <ToolDisplay.Dynamic
                            key={`${id}-tool-${part.toolCallId}`}
                            toolPart={part}
                          />
                        )
                      }
                      case 'tool-list_policies':
                      case 'tool-search_docs': {
                        return (
                          <ToolDisplay.BasicTool
                            key={`${id}-tool-${part.toolCallId}`}
                            toolPart={part}
                          />
                        )
                      }
                      case 'reasoning':
                        return (
                          <ToolDisplay.Reasoning
                            key={`${message.id}-${index}}`}
                            reasoningPart={part}
                          />
                        )
                      case 'text':
                        return (
                          <MessageDisplay.Markdown
                            key={`${id}-part-${index}`}
                            id={id}
                            isLoading={isLoading}
                            readOnly={readOnly}
                            className={cn(
                              'max-w-none space-y-4 prose prose-sm prose-li:mt-1 [&>div]:my-4 prose-h1:text-xl prose-h1:mt-6 prose-h2:text-lg prose-h3:no-underline prose-h3:text-base prose-h3:mb-4 prose-strong:font-medium prose-strong:text-foreground prose-ol:space-y-3 prose-ul:space-y-3 prose-li:my-0 break-words [&>p:not(:last-child)]:!mb-2 [&>*>p:first-child]:!mt-0 [&>*>p:last-child]:!mb-0 [&>*>*>p:first-child]:!mt-0 [&>*>*>p:last-child]:!mb-0 [&>ol>li]:!pl-4',
                              isUser && 'text-foreground [&>p]:font-medium',
                              isBeingEdited && 'animate-pulse'
                            )}
                          >
                            {part.text}
                          </MessageDisplay.Markdown>
                        )

                      case 'tool-execute_sql': {
                        return (
                          <ToolDisplay.ExecuteSql
                            key={`${id}-tool-execute_sql`}
                            id={id}
                            toolPart={part}
                            isLastPart={isLastPart}
                            isLastMessage={isLastMessage}
                            addToolResult={addToolResult}
                          />
                        )
                      }
                      case 'tool-deploy_edge_function': {
                        const { toolCallId, state, input } = part
                        if (state === 'input-streaming') {
                          return (
                            <div
                              key={`${id}-tool-loading-execute_sql`}
                              className="my-4 rounded-lg border bg-surface-75 heading-meta h-9 px-3 text-foreground-light flex items-center gap-2"
                            >
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Writing Edge Function...
                            </div>
                          )
                        }
                        if (state === 'input-available' || state === 'output-available') {
                          const isInitiallyDeployed =
                            state === 'output-available' && (part as any)?.output?.success === true
                          return (
                            <EdgeFunctionRenderer
                              key={`${id}-tool-${toolCallId}`}
                              label={(input as any).name || 'Edge Function'}
                              code={(input as any).code}
                              functionName={(input as any).name || 'my-function'}
                              showConfirmFooter={!part.output}
                              initialIsDeployed={isInitiallyDeployed}
                              onDeployed={async (res) => {
                                await addToolResult?.({
                                  tool: 'deploy_edge_function',
                                  toolCallId: String(toolCallId),
                                  output: res,
                                })
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
                      default:
                        return null
                    }
                  }
                )
              })()
            : hasTextContent && (
                <MessageDisplay.TextMessage id={id} isLoading={isLoading} readOnly={readOnly}>
                  {content}
                </MessageDisplay.TextMessage>
              )}
        </div>
      </MessageMainArea>
    </MessageDisplayContainer>
  )
}

function MessageTools({ children }: PropsWithChildren<{}>) {
  return (
    <div className="flex items-center gap-4 mt-2 mb-1">
      <span className="h-0.5 w-5 bg-muted" />
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">{children}</div>
    </div>
  )
}

function MessageToolsEdit({ onClick, tooltip }: { onClick: () => void; tooltip: string }) {
  return (
    <ButtonTooltip
      type="text"
      icon={<Pencil size={14} strokeWidth={1.5} />}
      onClick={onClick}
      className="text-foreground-light hover:text-foreground p-1 rounded"
      aria-label={tooltip}
      tooltip={{
        content: {
          side: 'bottom',
          text: tooltip,
        },
      }}
    />
  )
}
MessageTools.Edit = MessageToolsEdit

function MessageToolsDelete({ onClick }: { onClick: () => void }) {
  return (
    <ButtonTooltip
      type="text"
      icon={<Trash2 size={14} strokeWidth={1.5} />}
      tooltip={{ content: { side: 'bottom', text: 'Delete message' } }}
      onClick={onClick}
      className="text-foreground-light hover:text-foreground p-1 rounded"
      title="Delete message"
      aria-label="Delete message"
    />
  )
}
MessageTools.Delete = MessageToolsDelete

interface UserMessageStateShared {
  status: string
  onDelete: () => void
}

interface UserMessageStateIdle extends UserMessageStateShared {
  status: 'idle'
  onEdit: () => void
}

interface UserMessageStateEditing extends UserMessageStateShared {
  status: 'editing'
  onCancelEdit: () => void
}

interface UserMessageStatePredecessorEditing extends UserMessageStateShared {
  status: 'predecessor-editing'
  onCancelEdit: () => void
}

type UserMessageState =
  | UserMessageStateIdle
  | UserMessageStateEditing
  | UserMessageStatePredecessorEditing

function UserMessage(state: UserMessageState) {
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)

  return (
    <>
      <MessageDisplay.Container>
        <MessageDisplay.MainArea></MessageDisplay.MainArea>
        <MessageTools>
          <MessageTools.Edit
            onClick={state.status === 'idle' ? state.onEdit : state.onCancelEdit}
            tooltip={state.status === 'idle' ? 'Edit message' : 'Cancel editing'}
          />
          <MessageTools.Delete onClick={() => setShowDeleteConfirmModal(true)} />
        </MessageTools>
      </MessageDisplay.Container>
      <DeleteMessageConfirmModal
        visible={showDeleteConfirmModal}
        onConfirm={() => {
          state.onDelete()
          setShowDeleteConfirmModal(false)
          toast.success('Message deleted successfully')
        }}
        onCancel={() => setShowDeleteConfirmModal(false)}
      />
    </>
  )
}

export function Message(props: PropsWithChildren<MessageProps>) {
  const { role } = props.message
  const isUser = role === 'user'

  if (isUser) return <MessageDisplay {...props} />
  return <MessageDisplay {...props} />
}
