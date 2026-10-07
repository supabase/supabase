import { UIMessage as VercelMessage } from '@ai-sdk/react'
import { isToolUIPart, type TextUIPart, type ToolUIPart } from 'ai'
import { BrainIcon, CheckIcon, CircleStop, Loader2, XIcon } from 'lucide-react'
import { memo, type ReactNode } from 'react'
import { cn } from 'ui'
import { Markdown } from 'ui-patterns/Markdown'

import { AssistantQueryCell } from './AssistantQueryCell'
import { toAssistantQueryResult } from './AssistantQueryCell.utils'
import { getManualToolApprovalHandlers } from './Confirm.utils'
import { EdgeFunctionRenderer } from './EdgeFunctionRenderer'
import { Tool } from './elements/Tool'
import { ToolGroup } from './elements/ToolGroup'
import { useMessageActionsContext, useMessageInfoContext } from './Message.Context'
import {
  areMessagePartsEqual,
  getCompactPartLabel,
  getCompactPartStatus,
  getToolGroupSummary,
  INTERRUPTED_LABEL,
  isCompactToolCall,
  isRunningToolCall,
  type CompactPart,
  type CompactPartStatus,
} from './Message.Parts.utils'
import {
  deployEdgeFunctionInputSchema,
  deployEdgeFunctionOutputSchema,
  parseExecuteSqlChartResult,
} from './Message.utils'
import { MessageMarkdown } from './MessageMarkdown'
import { MessagePartQueryLogs } from './MessagePartQueryLogs'
import { NotebookProposalRenderer, type NotebookProposalMode } from './NotebookProposalRenderer'
import { NotebookRunRenderer } from './NotebookRunRenderer'
import { parseSupportRequestMessage, SupportRequestMessage } from './SupportRequestMessage'
import { useMinimumDisplayTime } from '@/hooks/misc/useMinimumDisplayTime'

function MessagePartText({ textPart }: { textPart: TextUIPart }) {
  const { id, isLoading, readOnly, isUserMessage, state } = useMessageInfoContext()
  const supportRequest = isUserMessage ? parseSupportRequestMessage(textPart.text) : null

  if (supportRequest) {
    return <SupportRequestMessage request={supportRequest} />
  }

  return (
    <MessageMarkdown
      id={id}
      isLoading={isLoading}
      readOnly={readOnly}
      className={cn(
        'max-w-none space-y-4 prose prose-sm prose-li:mt-1 [&>div]:my-4 prose-h1:text-xl prose-h1:mt-6 prose-h2:text-lg prose-h2:font-medium prose-h3:no-underline prose-h3:text-base prose-h3:mb-4 prose-strong:font-medium prose-strong:text-foreground prose-ol:space-y-3 prose-ul:space-y-3 prose-li:my-0 wrap-break-word [&>p:not(:last-child)]:mb-2! [&>*>p:first-child]:mt-0! [&>*>p:last-child]:mb-0! [&>*>*>p:first-child]:mt-0! [&>*>*>p:last-child]:mb-0! [&>ol>li]:pl-4!',
        isUserMessage && 'text-foreground [&>p]:font-medium',
        state === 'editing' && 'animate-pulse'
      )}
    >
      {textPart.text}
    </MessageMarkdown>
  )
}

const COMPACT_STATUS_ICONS: Record<CompactPartStatus, ReactNode> = {
  running: <Loader2 strokeWidth={1.5} size={12} className="animate-spin" />,
  done: <CheckIcon strokeWidth={1.5} size={12} className="text-foreground-muted" />,
  failed: <XIcon strokeWidth={1.5} size={12} className="text-destructive" />,
}

function MessagePartCompact({ part, isActive }: { part: CompactPart; isActive?: boolean }) {
  const status = getCompactPartStatus(part)
  const isReasoning = part.type === 'reasoning'

  return (
    <Tool
      isActive={isActive}
      icon={
        isReasoning && status === 'done' ? (
          <BrainIcon strokeWidth={1.5} size={12} className="text-foreground-muted" />
        ) : (
          COMPACT_STATUS_ICONS[status]
        )
      }
      label={getCompactPartLabel(part)}
    >
      {isReasoning ? (
        <Markdown className="text-xs text-foreground-lighter [&>p]:m-0 flex flex-col gap-y-1">
          {part.text}
        </Markdown>
      ) : undefined}
    </Tool>
  )
}

function ToolDisplayExecuteSqlLoading({ label = 'Writing SQL...' }: { label?: string }) {
  return (
    <div className="my-4 rounded-lg border bg-surface-75 heading-meta h-9 px-3 text-foreground-light flex items-center gap-2">
      <Loader2 className="w-4 h-4 animate-spin" />
      {label}
    </div>
  )
}

function MessagePartExecuteSql({ toolPart }: { toolPart: ToolUIPart }) {
  const { id } = useMessageInfoContext()
  const { addToolApprovalResponse } = useMessageActionsContext()

  const { toolCallId, state, input: submittedInput, output } = toolPart
  const input = state === 'output-error' ? (submittedInput ?? toolPart.rawInput) : submittedInput

  if (state === 'input-streaming') {
    return <ToolDisplayExecuteSqlLoading />
  }

  const { data: chart, success } = parseExecuteSqlChartResult(input)
  if (!success) return null

  if (
    state === 'input-available' ||
    state === 'approval-requested' ||
    state === 'approval-responded' ||
    state === 'output-denied' ||
    state === 'output-available' ||
    state === 'output-error'
  ) {
    const { confirmState, onApprove, onDeny } = getManualToolApprovalHandlers({
      state,
      approval: toolPart.approval,
      addToolApprovalResponse,
    })

    return (
      <div className="w-auto overflow-x-hidden my-4 space-y-2">
        <AssistantQueryCell
          id={`${id}-${toolCallId}`}
          sql={chart.sql}
          title={chart.label}
          initialResult={
            state === 'output-error'
              ? { rows: [], error: { message: toolPart.errorText ?? 'Failed to execute SQL' } }
              : toAssistantQueryResult(output)
          }
          view={chart.view}
          xAxis={chart.xAxis}
          yAxis={chart.yAxis}
          confirmState={confirmState}
          onApprove={onApprove}
          onDeny={onDeny}
        />
      </div>
    )
  }

  return null
}

const TOOL_DEPLOY_EDGE_FUNCTION_STATES_WITH_INPUT = new Set([
  'input-available',
  'approval-requested',
  'approval-responded',
  'output-denied',
  'output-available',
  'output-error',
])

function MessagePartDeployEdgeFunction({ toolPart }: { toolPart: ToolUIPart }) {
  const { state, input: submittedInput, output } = toolPart
  const input = state === 'output-error' ? (submittedInput ?? toolPart.rawInput) : submittedInput
  const { addToolApprovalResponse } = useMessageActionsContext()

  if (state === 'input-streaming') {
    return (
      <div className="my-4 rounded-lg border bg-surface-75 heading-meta h-9 px-3 text-foreground-light flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Writing Edge Function...
      </div>
    )
  }

  if (!TOOL_DEPLOY_EDGE_FUNCTION_STATES_WITH_INPUT.has(state)) return null

  const parsedInput = deployEdgeFunctionInputSchema.safeParse(input)
  if (!parsedInput.success) return null

  const parsedOutput = deployEdgeFunctionOutputSchema.safeParse(output)
  const isInitiallyDeployed =
    state === 'output-available' && parsedOutput.success && parsedOutput.data.success === true

  const { confirmState, onApprove, onDeny } = getManualToolApprovalHandlers({
    state,
    approval: toolPart.approval,
    addToolApprovalResponse,
  })

  return (
    <EdgeFunctionRenderer
      label={parsedInput.data.label}
      code={parsedInput.data.code}
      functionName={parsedInput.data.functionName}
      confirmState={confirmState}
      isDeploying={confirmState === 'approval-responded'}
      initialIsDeployed={isInitiallyDeployed}
      errorText={state === 'output-error' ? toolPart.errorText : undefined}
      onApprove={onApprove}
      onDeny={onDeny}
    />
  )
}

const NOTEBOOK_DRAFTING_LABEL: Record<NotebookProposalMode, string> = {
  create: 'Drafting notebook...',
  update: 'Drafting notebook update...',
  delete: 'Preparing to delete notebook...',
}

function MessagePartNotebookProposal({
  toolPart,
  mode,
}: {
  toolPart: ToolUIPart
  mode: NotebookProposalMode
}) {
  const { state, input: submittedInput, output } = toolPart
  const input = state === 'output-error' ? (submittedInput ?? toolPart.rawInput) : submittedInput
  const { addToolApprovalResponse } = useMessageActionsContext()

  if (state === 'input-streaming') {
    return <ToolDisplayExecuteSqlLoading label={NOTEBOOK_DRAFTING_LABEL[mode]} />
  }

  const { confirmState, onApprove, onDeny, denyWithReason } = getManualToolApprovalHandlers({
    state,
    approval: toolPart.approval,
    addToolApprovalResponse,
  })

  return (
    <NotebookProposalRenderer
      mode={mode}
      state={state}
      input={input}
      output={output}
      confirmState={confirmState}
      onApprove={onApprove}
      onDeny={onDeny}
      denyWithReason={denyWithReason}
    />
  )
}

function MessagePartNotebookRun({ toolPart }: { toolPart: ToolUIPart }) {
  const { state, input: submittedInput, output } = toolPart
  const input = state === 'output-error' ? (submittedInput ?? toolPart.rawInput) : submittedInput
  const { addToolApprovalResponse } = useMessageActionsContext()

  if (state === 'input-streaming')
    return <ToolDisplayExecuteSqlLoading label="Preparing notebook..." />

  const { confirmState, onApprove, onDeny } = getManualToolApprovalHandlers({
    state,
    approval: toolPart.approval,
    addToolApprovalResponse,
  })

  return (
    <NotebookRunRenderer
      state={state}
      input={input}
      output={output}
      confirmState={confirmState}
      onApprove={onApprove}
      onDeny={onDeny}
    />
  )
}

const MessagePart = {
  Text: MessagePartText,
  Compact: MessagePartCompact,
  ExecuteSql: MessagePartExecuteSql,
  QueryLogs: MessagePartQueryLogs,
  DeployEdgeFunction: MessagePartDeployEdgeFunction,
  NotebookProposal: MessagePartNotebookProposal,
  NotebookRun: MessagePartNotebookRun,
} as const

// Wide parts share the default width for now; the split stays so a part can diverge again.
const MESSAGE_PART_WIDTH = 'max-w-3xl'
const WIDE_MESSAGE_PART_WIDTH = 'max-w-3xl'

function MessagePartContainer({
  children,
  isWide = false,
}: {
  children: ReactNode
  isWide?: boolean
}) {
  return (
    <div className={cn('w-full mx-auto', isWide ? WIDE_MESSAGE_PART_WIDTH : MESSAGE_PART_WIDTH)}>
      {children}
    </div>
  )
}

const isWideMessagePart = (part: NonNullable<VercelMessage['parts']>[number]) =>
  part.type === 'tool-execute_sql' ||
  part.type === 'tool-query_logs' ||
  part.type === 'tool-create_notebook' ||
  part.type === 'tool-update_notebook' ||
  part.type === 'tool-delete_notebook' ||
  part.type === 'tool-run_notebook' ||
  (part.type === 'dynamic-tool' && part.toolName === 'query_logs') ||
  // Unlabelled code fences resolve to SQL in MessageMarkdown, too.
  (part.type === 'text' && /```(?:sql)?(?:\s|$)/i.test(part.text))

export const MessagePartSwitcher = memo(
  function MessagePartSwitcher({
    part,
    isActive,
  }: {
    part: NonNullable<VercelMessage['parts']>[number]
    /** Marks the in-progress call within a running tool group. */
    isActive?: boolean
  }) {
    const { isLoading, isLastMessage } = useMessageInfoContext()
    const isActiveMessage = isLoading && isLastMessage
    // Compact rows and query_logs run on the server, so `input-available` means the tool never
    // returned. Other tools wait in that state for the user to act.
    const isServerToolAwaitingOutput =
      isToolUIPart(part) &&
      part.state === 'input-available' &&
      (isCompactToolCall(part) ||
        part.type === 'tool-query_logs' ||
        (part.type === 'dynamic-tool' && part.toolName === 'query_logs'))
    const isIncompletePart =
      (part.type === 'reasoning' && part.state === 'streaming') ||
      (isToolUIPart(part) && part.state === 'input-streaming') ||
      isServerToolAwaitingOutput

    if (!isActiveMessage && isIncompletePart) {
      return (
        <Tool
          icon={<CircleStop strokeWidth={1.5} size={12} className="text-foreground-muted" />}
          label={INTERRUPTED_LABEL}
        >
          {part.type === 'reasoning' ? part.text : undefined}
        </Tool>
      )
    }

    // Tool rows depend on being direct siblings to share their compact spacing and dividers.
    if (part.type === 'reasoning' || (isToolUIPart(part) && isCompactToolCall(part))) {
      return <MessagePart.Compact part={part} isActive={isActive} />
    }

    const content = (() => {
      switch (part.type) {
        case 'dynamic-tool': {
          return <MessagePart.QueryLogs toolPart={part} />
        }
        case 'text':
          return <MessagePart.Text textPart={part} />

        case 'tool-execute_sql': {
          return <MessagePart.ExecuteSql toolPart={part} />
        }
        case 'tool-query_logs': {
          return <MessagePart.QueryLogs toolPart={part} />
        }
        case 'tool-deploy_edge_function': {
          return <MessagePart.DeployEdgeFunction toolPart={part} />
        }
        case 'tool-create_notebook': {
          return <MessagePart.NotebookProposal toolPart={part} mode="create" />
        }
        case 'tool-update_notebook': {
          return <MessagePart.NotebookProposal toolPart={part} mode="update" />
        }
        case 'tool-delete_notebook': {
          return <MessagePart.NotebookProposal toolPart={part} mode="delete" />
        }
        case 'tool-run_notebook': {
          return <MessagePart.NotebookRun toolPart={part} />
        }

        case 'source-url':
        case 'source-document':
        case 'file':
        default:
          return null
      }
    })()

    if (content === null) return null
    return <MessagePartContainer isWide={isWideMessagePart(part)}>{content}</MessagePartContainer>
  },
  (previous, next) =>
    previous.isActive === next.isActive && areMessagePartsEqual(previous.part, next.part)
)

// Long enough to read a short label before the next one replaces it
const MIN_HEADER_DISPLAY_MS = 1000

export function MessagePartToolGroup({
  parts,
  isRunning,
}: {
  parts: CompactPart[]
  isRunning: boolean
}) {
  // A tool call leads the header only while it executes. The rest of the time the model is thinking.
  const runningIndex = useMinimumDisplayTime(
    parts.findLastIndex(isRunningToolCall),
    MIN_HEADER_DISPLAY_MS
  )
  const runningToolCall: CompactPart | undefined = parts[runningIndex]

  let header = runningToolCall ? getCompactPartLabel(runningToolCall, 'running') : 'Thinking...'
  if (!isRunning) header = getToolGroupSummary(parts)

  return (
    <ToolGroup label={header} isActive={isRunning}>
      {parts.map((part, idx) => {
        // Some models don't share their reasoning, leaving finished rows with nothing to expand
        if (part.type === 'reasoning' && part.state === 'done' && !part.text.trim()) return null

        // Parallel calls can leave several rows in progress at once
        const isActive = isRunning && getCompactPartStatus(part) === 'running'
        return <MessagePartSwitcher key={idx} part={part} isActive={isActive} />
      })}
    </ToolGroup>
  )
}
