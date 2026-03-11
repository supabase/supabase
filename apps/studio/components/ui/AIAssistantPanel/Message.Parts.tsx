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

function MessagePartText({ textPart }: { textPart: TextUIPart }) {
  const { id, isLoading, readOnly, isUserMessage, state } = useMessageInfoContext()

  return (
    <MessageMarkdown
      id={id}
      isLoading={isLoading}
      readOnly={readOnly}
      className={cn(
        'max-w-none space-y-4 prose prose-sm prose-li:mt-1 [&>div]:my-4 prose-h1:text-xl prose-h1:mt-6 prose-h2:text-lg prose-h2:font-medium prose-h3:no-underline prose-h3:text-base prose-h3:mb-4 prose-strong:font-medium prose-strong:text-foreground prose-ol:space-y-3 prose-ul:space-y-3 prose-li:my-0 break-words [&>p:not(:last-child)]:!mb-2 [&>*>p:first-child]:!mt-0 [&>*>p:last-child]:!mb-0 [&>*>*>p:first-child]:!mt-0 [&>*>*>p:last-child]:!mb-0 [&>ol>li]:!pl-4',
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
    return <p className="text-xs text-danger">Failed to deploy Edge Function.</p>
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

export function MessagePartSwitcher({
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
    case 'tool-search_docs':
    case 'tool-get_active_incidents': {
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
