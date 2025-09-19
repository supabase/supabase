import { UIMessage as VercelMessage } from '@ai-sdk/react'
import { type DynamicToolUIPart, type ToolUIPart, type ReasoningUIPart, type TextUIPart } from 'ai'
import { BrainIcon, CheckIcon, Loader2, Pencil, Trash2 } from 'lucide-react'
import { PropsWithChildren, useMemo, useState, createContext, useContext } from 'react'
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
import {
  deployEdgeFunctionInputSchema,
  deployEdgeFunctionOutputSchema,
  parseExecuteSqlChartResult,
} from './Message.utils'

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

function MessageDisplayMainArea({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return <div className={cn('flex gap-4 w-auto overflow-hidden group', className)}>{children}</div>
}

function MessageDisplayContent({ message }: { message: VercelMessage }) {
  const { id, isLoading, readOnly } = useMessageInfoContext()

  const messageParts = message.parts
  const content =
    ('content' in message && typeof message.content === 'string' && message.content.trim()) ||
    undefined

  return (
    <div className="flex-1 min-w-0">
      {messageParts?.length > 0
        ? messageParts.map((part: NonNullable<VercelMessage['parts'][number]>, idx) => {
            const isLastPart = idx === messageParts.length - 1
            return <MessagePartSwitcher part={part} isLastPart={isLastPart} />
          })
        : content && (
            <MessageDisplayTextMessage id={id} isLoading={isLoading} readOnly={readOnly}>
              {content}
            </MessageDisplayTextMessage>
          )}
    </div>
  )
}

function MessageDisplayTextMessage({
  id,
  isLoading,
  readOnly,
  children,
}: PropsWithChildren<{ id: string; isLoading: boolean; readOnly?: boolean }>) {
  return (
    <MessageDisplayMarkdown
      id={id}
      isLoading={isLoading}
      readOnly={readOnly}
      className="prose prose-sm max-w-none break-words"
    >
      {children}
    </MessageDisplayMarkdown>
  )
}

const MessageDisplay = {
  Container: MessageDisplayContainer,
  Content: MessageDisplayContent,
  MainArea: MessageDisplayMainArea,
  Markdown: MessageDisplayMarkdown,
  ProfileImage: MessageDisplayProfileImage,
}

type AddToolResult = (args: { tool: string; toolCallId: string; output: unknown }) => Promise<void>

function MessagePartText({ textPart }: { textPart: TextUIPart }) {
  const { id, isLoading, readOnly, isUserMessage, state } = useMessageInfoContext()

  return (
    <MessageDisplay.Markdown
      id={id}
      isLoading={isLoading}
      readOnly={readOnly}
      className={cn(
        'max-w-none space-y-4 prose prose-sm prose-li:mt-1 [&>div]:my-4 prose-h1:text-xl prose-h1:mt-6 prose-h2:text-lg prose-h3:no-underline prose-h3:text-base prose-h3:mb-4 prose-strong:font-medium prose-strong:text-foreground prose-ol:space-y-3 prose-ul:space-y-3 prose-li:my-0 break-words [&>p:not(:last-child)]:!mb-2 [&>*>p:first-child]:!mt-0 [&>*>p:last-child]:!mb-0 [&>*>*>p:first-child]:!mt-0 [&>*>*>p:last-child]:!mb-0 [&>ol>li]:!pl-4',
        isUserMessage && 'text-foreground [&>p]:font-medium',
        state === 'editing' && 'animate-pulse'
      )}
    >
      {textPart.text}
    </MessageDisplay.Markdown>
  )
}

function MessagePartDynamicTool({ toolPart }: { toolPart: DynamicToolUIPart }) {
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

function MessagePartTool({ toolPart }: { toolPart: ToolUIPart }) {
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

function MessagePartReasoning({ reasoningPart }: { reasoningPart: ReasoningUIPart }) {
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

function MessagePartExecuteSql({
  toolPart,
  isLastPart,
}: {
  toolPart: ToolUIPart
  isLastPart?: boolean
}) {
  const { id, isLastMessage } = useMessageInfoContext()
  const { addToolResult } = useMessageActionsContext()

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

const TOOL_DEPLOY_EDGE_FUNCTION_STATES_WITH_INPUT = new Set(['input-available', 'output-available'])

function MessagePartDeployEdgeFunction({ toolPart }: { toolPart: ToolUIPart }) {
  const { toolCallId, state, input, output } = toolPart
  const { addToolResult } = useMessageActionsContext()

  if (state === 'input-streaming') {
    return (
      <div className="my-4 rounded-lg border bg-surface-75 heading-meta h-9 px-3 text-foreground-light flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Writing Edge Function...
      </div>
    )
  }

  if (state === 'output-error') {
    return <div className="text-xs text-danger">Failed to deploy Edge Function.</div>
  }

  if (!TOOL_DEPLOY_EDGE_FUNCTION_STATES_WITH_INPUT.has(state)) return null

  const parsedInput = deployEdgeFunctionInputSchema.safeParse(input)
  if (!parsedInput.success) return null

  const parsedOutput = deployEdgeFunctionOutputSchema.safeParse(output)
  const isInitiallyDeployed =
    state === 'output-available' && parsedOutput.success && parsedOutput.data.success === true

  return (
    <EdgeFunctionRenderer
      label={parsedInput.data.label}
      code={parsedInput.data.code}
      functionName={parsedInput.data.functionName}
      showConfirmFooter={!output}
      initialIsDeployed={isInitiallyDeployed}
      onDeployed={(result) => {
        addToolResult?.({
          tool: 'deploy_edge_function',
          toolCallId: String(toolCallId),
          output: result,
        })
      }}
    />
  )
}

const MessagePart = {
  Text: MessagePartText,
  Dynamic: MessagePartDynamicTool,
  Tool: MessagePartTool,
  Reasoning: MessagePartReasoning,
  ExecuteSql: MessagePartExecuteSql,
  DeployEdgeFunction: MessagePartDeployEdgeFunction,
} as const

function MessagePartSwitcher({
  part,
  isLastPart,
}: {
  part: NonNullable<VercelMessage['parts']>[number]
  isLastPart?: boolean
}) {
  switch (part.type) {
    case 'dynamic-tool': {
      return <MessagePart.Dynamic toolPart={part} />
    }
    case 'tool-list_policies':
    case 'tool-search_docs': {
      return <MessagePart.Tool toolPart={part} />
    }
    case 'reasoning':
      return <MessagePart.Reasoning reasoningPart={part} />
    case 'text':
      return <MessagePart.Text textPart={part} />

    case 'tool-execute_sql': {
      return <MessagePart.ExecuteSql toolPart={part} isLastPart={isLastPart} />
    }
    case 'tool-deploy_edge_function': {
      return <MessagePart.DeployEdgeFunction toolPart={part} />
    }

    case 'source-url':
    case 'source-document':
    case 'file':
    default:
      return null
  }
}

interface MessageInfo {
  id: string

  variant?: 'default' | 'warning'

  isLoading: boolean
  readOnly?: boolean

  isUserMessage?: boolean
  isLastMessage?: boolean

  state: 'idle' | 'editing' | 'predecessor-editing'
}

interface MessageActions {
  addToolResult?: AddToolResult

  onDelete: (id: string) => void
  onEdit: (id: string) => void
  onCancelEdit: () => void
}

const MessageInfoContext = createContext<MessageInfo | null>(null)
const MessageActionsContext = createContext<MessageActions | null>(null)

function useMessageInfoContext() {
  const ctx = useContext(MessageInfoContext)
  if (!ctx) {
    throw Error('useMessageInfoContext must be used within a MessageProvider')
  }
  return ctx
}

function useMessageActionsContext() {
  const ctx = useContext(MessageActionsContext)
  if (!ctx) {
    throw Error('useMessageActionsContext must be used within a MessageProvider')
  }
  return ctx
}

function MessageProvider({
  messageInfo,
  messageActions,
  children,
}: PropsWithChildren<{ messageInfo: MessageInfo; messageActions: MessageActions }>) {
  return (
    <MessageInfoContext.Provider value={messageInfo}>
      <MessageActionsContext.Provider value={messageActions}>
        {children}
      </MessageActionsContext.Provider>
    </MessageInfoContext.Provider>
  )
}

function MessageActions({ children }: PropsWithChildren<{}>) {
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
MessageActions.Edit = MessageToolsEdit

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
MessageActions.Delete = MessageToolsDelete

function AssistantMessage({ message }: { message: VercelMessage }) {
  const { variant, state } = useMessageInfoContext()
  const { onCancelEdit } = useMessageActionsContext()

  return (
    <MessageDisplay.Container
      className={cn(
        variant === 'warning' && 'bg-warning-200',
        state === 'predecessor-editing' && 'opacity-50 transition-opacity cursor-pointer'
      )}
      onClick={state === 'predecessor-editing' ? onCancelEdit : undefined}
    >
      <MessageDisplay.MainArea>
        <MessageDisplay.Content message={message} />
      </MessageDisplay.MainArea>
    </MessageDisplay.Container>
  )
}

function UserMessage({ message }: { message: VercelMessage }) {
  const { id, variant, state } = useMessageInfoContext()
  const { onCancelEdit, onEdit, onDelete } = useMessageActionsContext()
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)

  return (
    <>
      <MessageDisplay.Container
        className={cn(
          'mt-6 text-foreground',
          variant === 'warning' && 'bg-warning-200',
          state === 'predecessor-editing' && 'opacity-50 transition-opacity cursor-pointer'
        )}
        onClick={state === 'predecessor-editing' ? onCancelEdit : undefined}
      >
        <MessageDisplay.MainArea>
          <MessageDisplay.ProfileImage />
          <MessageDisplay.Content message={message} />
        </MessageDisplay.MainArea>
        <MessageActions>
          <MessageActions.Edit
            onClick={state === 'idle' ? () => onEdit(id) : onCancelEdit}
            tooltip={state === 'idle' ? 'Edit message' : 'Cancel editing'}
          />
          <MessageActions.Delete onClick={() => setShowDeleteConfirmModal(true)} />
        </MessageActions>
      </MessageDisplay.Container>
      <DeleteMessageConfirmModal
        visible={showDeleteConfirmModal}
        onConfirm={() => {
          onDelete(id)
          setShowDeleteConfirmModal(false)
          toast.success('Message deleted successfully')
        }}
        onCancel={() => setShowDeleteConfirmModal(false)}
      />
    </>
  )
}

interface MessageProps {
  id: string
  message: VercelMessage
  isLoading: boolean
  readOnly?: boolean
  variant?: 'default' | 'warning'
  addToolResult?: AddToolResult
  onDelete: (id: string) => void
  onEdit: (id: string) => void
  isAfterEditedMessage: boolean
  isBeingEdited: boolean
  onCancelEdit: () => void
  isLastMessage?: boolean
}

export function Message(props: MessageProps) {
  const message = props.message
  const { role } = message
  const isUserMessage = role === 'user'

  const messageInfo = {
    id: props.id,
    isLoading: props.isLoading,
    readOnly: props.readOnly,
    variant: props.variant,
    state: props.isBeingEdited
      ? 'editing'
      : props.isAfterEditedMessage
        ? 'predecessor-editing'
        : 'idle',
    isLastMessage: props.isLastMessage,
  } satisfies MessageInfo

  const messageActions = {
    addToolResult: props.addToolResult,
    onDelete: props.onDelete,
    onEdit: props.onEdit,
    onCancelEdit: props.onCancelEdit,
  }

  return (
    <MessageProvider messageInfo={messageInfo} messageActions={messageActions}>
      {isUserMessage ? <UserMessage message={message} /> : <AssistantMessage message={message} />}
    </MessageProvider>
  )
}
