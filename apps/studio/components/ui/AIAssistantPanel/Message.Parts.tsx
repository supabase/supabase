import { UIMessage as VercelMessage } from '@ai-sdk/react'
import { type DynamicToolUIPart, type ReasoningUIPart, type TextUIPart, type ToolUIPart } from 'ai'
import { BrainIcon, CheckIcon, Loader2 } from 'lucide-react'
import { type ReactNode } from 'react'
import { cn } from 'ui'

import { AssistantQueryCell } from './AssistantQueryCell'
import { toAssistantQueryResult } from './AssistantQueryCell.utils'
import { getManualToolApprovalHandlers } from './Confirm.utils'
import { EdgeFunctionRenderer } from './EdgeFunctionRenderer'
import { Tool } from './elements/Tool'
import { useMessageActionsContext, useMessageInfoContext } from './Message.Context'
import {
  deployEdgeFunctionInputSchema,
  deployEdgeFunctionOutputSchema,
  parseExecuteSqlChartResult,
} from './Message.utils'
import { MessageMarkdown } from './MessageMarkdown'
import { MessagePartQueryLogs } from './MessagePartQueryLogs'
import { NotebookProposalRenderer, type NotebookProposalMode } from './NotebookProposalRenderer'
import { parseSupportRequestMessage, SupportRequestMessage } from './SupportRequestMessage'

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
    return (
      <div className="my-4 mx-4 rounded-lg border bg-surface-75 heading-meta h-9 px-3 text-foreground-light flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        {NOTEBOOK_DRAFTING_LABEL[mode]}
      </div>
    )
  }

  const { confirmState, onApprove, onDeny } = getManualToolApprovalHandlers({
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
    />
  )
}

const MessagePart = {
  Text: MessagePartText,
  Dynamic: MessagePartDynamicTool,
  Tool: MessagePartTool,
  Reasoning: MessagePartReasoning,
  ExecuteSql: MessagePartExecuteSql,
  QueryLogs: MessagePartQueryLogs,
  DeployEdgeFunction: MessagePartDeployEdgeFunction,
  NotebookProposal: MessagePartNotebookProposal,
} as const

function MessagePartContainer({
  children,
  isWide = false,
}: {
  children: ReactNode
  isWide?: boolean
}) {
  return <div className={cn('w-full mx-auto', isWide ? 'max-w-6xl' : 'max-w-3xl')}>{children}</div>
}

const isWideMessagePart = (part: NonNullable<VercelMessage['parts']>[number]) =>
  part.type === 'tool-execute_sql' ||
  part.type === 'tool-query_logs' ||
  part.type === 'tool-create_notebook' ||
  part.type === 'tool-update_notebook' ||
  (part.type === 'dynamic-tool' && part.toolName === 'query_logs') ||
  // Unlabelled code fences resolve to SQL in MessageMarkdown, too.
  (part.type === 'text' && /```(?:sql)?(?:\s|$)/i.test(part.text))

const isCompactToolPart = (part: NonNullable<VercelMessage['parts']>[number]) =>
  part.type === 'reasoning' ||
  (part.type === 'dynamic-tool' && part.toolName !== 'query_logs') ||
  part.type === 'tool-list_policies' ||
  part.type === 'tool-search_docs' ||
  part.type === 'tool-get_active_incidents' ||
  part.type === 'tool-load_knowledge'

export function MessagePartSwitcher({
  part,
}: {
  part: NonNullable<VercelMessage['parts']>[number]
}) {
  const content = (() => {
    switch (part.type) {
      case 'dynamic-tool': {
        if (part.toolName === 'query_logs') {
          return <MessagePart.QueryLogs toolPart={part} />
        }
        return <MessagePart.Dynamic toolPart={part} />
      }
      case 'tool-list_policies':
      case 'tool-search_docs':
      case 'tool-get_active_incidents':
      case 'tool-load_knowledge': {
        return <MessagePart.Tool toolPart={part} />
      }
      case 'reasoning':
        return <MessagePart.Reasoning reasoningPart={part} />
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

      case 'source-url':
      case 'source-document':
      case 'file':
      default:
        return null
    }
  })()

  if (content === null) return null
  // Tool rows depend on being direct siblings to share their compact spacing and dividers.
  if (isCompactToolPart(part)) return content

  return <MessagePartContainer isWide={isWideMessagePart(part)}>{content}</MessagePartContainer>
}
