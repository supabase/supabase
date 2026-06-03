import { UIMessage as VercelMessage } from '@ai-sdk/react'
import { type DynamicToolUIPart, type ReasoningUIPart, type TextUIPart, type ToolUIPart } from 'ai'
import { BrainIcon, CheckIcon, Loader2 } from 'lucide-react'
import { cn } from 'ui'

import { DisplayBlockRenderer } from './DisplayBlockRenderer'
import { EdgeFunctionRenderer } from './EdgeFunctionRenderer'
import { Tool } from './elements/Tool'
import { useMessageActionsContext, useMessageInfoContext } from './Message.Context'
import {
  deployEdgeFunctionInputSchema,
  deployEdgeFunctionOutputSchema,
  parseExecuteSqlChartResult,
} from './Message.utils'
import { MessageMarkdown } from './MessageMarkdown'
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

  const { toolCallId, state, input, output } = toolPart

  if (state === 'input-streaming') {
    return <ToolDisplayExecuteSqlLoading />
  }

  if (state === 'output-error') {
    return <ToolDisplayExecuteSqlFailure />
  }

  const { data: chart, success } = parseExecuteSqlChartResult(input)
  if (!success) return null

  if (
    state === 'input-available' ||
    state === 'approval-requested' ||
    state === 'approval-responded' ||
    state === 'output-denied' ||
    state === 'output-available'
  ) {
    const isAwaitingUserApproval =
      state === 'approval-requested' && isLastPart === true && isLastMessage === true

    return (
      <div className="w-auto overflow-x-hidden my-4">
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
          toolApprovalRespondedApproved={toolPart.approval?.approved}
          hideUtilityPanel={isAwaitingUserApproval}
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
])

function MessagePartDeployEdgeFunction({
  toolPart,
  isLastPart,
}: {
  toolPart: ToolUIPart
  isLastPart?: boolean
}) {
  const { state, input, output } = toolPart
  const { isLastMessage } = useMessageInfoContext()
  const { addToolApprovalResponse } = useMessageActionsContext()

  if (state === 'input-streaming') {
    return (
      <div className="my-4 rounded-lg border bg-surface-75 heading-meta h-9 px-3 text-foreground-light flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Writing Edge Function...
      </div>
    )
  }

  if (state === 'output-error') {
    return <p className="text-xs text-danger">Failed to deploy Edge Function.</p>
  }

  if (!TOOL_DEPLOY_EDGE_FUNCTION_STATES_WITH_INPUT.has(state)) return null

  const parsedInput = deployEdgeFunctionInputSchema.safeParse(input)
  if (!parsedInput.success) return null

  const parsedOutput = deployEdgeFunctionOutputSchema.safeParse(output)
  const isInitiallyDeployed =
    state === 'output-available' && parsedOutput.success && parsedOutput.data.success === true

  const approvalId = state === 'approval-requested' ? toolPart.approval?.id : undefined
  const isAwaitingUserApproval =
    state === 'approval-requested' && isLastPart === true && isLastMessage === true

  return (
    <EdgeFunctionRenderer
      label={parsedInput.data.label}
      code={parsedInput.data.code}
      functionName={parsedInput.data.functionName}
      isAwaitingUserApproval={isAwaitingUserApproval}
      isDeploying={state === 'approval-responded' && toolPart.approval?.approved !== false}
      initialIsDeployed={isInitiallyDeployed}
      onApprove={
        approvalId ? () => addToolApprovalResponse?.({ id: approvalId, approved: true }) : undefined
      }
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

export function MessagePartSwitcher({
  part,
  isLastPart,
}: {
  part: NonNullable<VercelMessage['parts']>[number]
  isLastPart?: boolean
}) {
  const renderPart = () => {
    switch (part.type) {
      case 'dynamic-tool': {
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
        return <MessagePart.ExecuteSql toolPart={part} isLastPart={isLastPart} />
      }
      case 'tool-deploy_edge_function': {
        return <MessagePart.DeployEdgeFunction toolPart={part} isLastPart={isLastPart} />
      }

      case 'source-url':
      case 'source-document':
      case 'file':
      default:
        return null
    }
  }

  const renderedPart = renderPart()
  if (!renderedPart) return null

  const isQueryBlock = part.type === 'tool-execute_sql'
  const isToolStatus =
    part.type === 'dynamic-tool' ||
    part.type === 'tool-list_policies' ||
    part.type === 'tool-search_docs' ||
    part.type === 'tool-get_active_incidents' ||
    part.type === 'tool-load_knowledge' ||
    part.type === 'reasoning'

  return (
    <div
      className={cn(
        'assistant-message-part w-full',
        isQueryBlock ? 'assistant-message-part-query' : 'assistant-message-part-standard',
        isToolStatus &&
          cn(
            'assistant-message-part-tool',
            '[&_.tool-item]:mt-0! [&_.tool-item]:mb-0!',
            '[&:not(.assistant-message-part-tool+.assistant-message-part-tool)]:mt-4',
            '[&:not(:has(+.assistant-message-part-tool))]:mb-4',
            '[&:has(+.assistant-message-part-tool)_.tool-item]:border-b',
            '[&:has(+.assistant-message-part-tool)_.tool-item]:border-b-muted'
          )
      )}
    >
      {renderedPart}
    </div>
  )
}
