import { UIMessage as VercelMessage } from '@ai-sdk/react'
import { type DynamicToolUIPart, type ReasoningUIPart, type TextUIPart, type ToolUIPart } from 'ai'
import { BrainIcon, CheckIcon, Loader2 } from 'lucide-react'
import { cn } from 'ui'

import { AssistantQueryCell } from './AssistantQueryCell'
import { getManualToolApprovalHandlers } from './Confirm.utils'
import { EdgeFunctionRenderer } from './EdgeFunctionRenderer'
import { Tool } from './elements/Tool'
import { useMessageActionsContext, useMessageInfoContext } from './Message.Context'
import {
  deployEdgeFunctionInputSchema,
  deployEdgeFunctionOutputSchema,
  openPullRequestInputSchema,
  openPullRequestOutputSchema,
  parseExecuteSqlChartResult,
} from './Message.utils'
import { MessageMarkdown } from './MessageMarkdown'
import { NotebookProposalRenderer, type NotebookProposalMode } from './NotebookProposalRenderer'
import { PullRequestRenderer } from './PullRequestRenderer'
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
  const repoLabels: Record<string, [string, string]> = {
    'tool-search_repo': ['Searching repository...', 'Searched repository'],
    'tool-read_repo_file': ['Reading repository file...', 'Read repository file'],
    'tool-write_repo_file': ['Updating repository...', 'Updated repository working copy'],
  }
  const repoLabel = repoLabels[toolPart.type]

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
        repoLabel ? (
          repoLabel[toolPart.state === 'input-streaming' ? 0 : 1]
        ) : (
          <div>
            {toolPart.state === 'input-streaming' ? 'Running ' : 'Ran '}
            <span className="text-foreground-lighter">{`${toolPart.type.replace('tool-', '')}`}</span>
          </div>
        )
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

function MessagePartExecuteSql({ toolPart }: { toolPart: ToolUIPart }) {
  const { id } = useMessageInfoContext()
  const { addToolApprovalResponse } = useMessageActionsContext()

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
          initialRows={output}
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
])

function MessagePartDeployEdgeFunction({ toolPart }: { toolPart: ToolUIPart }) {
  const { state, input, output } = toolPart
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
      onApprove={onApprove}
      onDeny={onDeny}
    />
  )
}

const NOTEBOOK_DRAFTING_LABEL: Record<NotebookProposalMode, string> = {
  create: 'Drafting notebook...',
  update: 'Drafting notebook update...',
}

const NOTEBOOK_FAILED_LABEL: Record<NotebookProposalMode, string> = {
  create: 'Failed to create notebook.',
  update: 'Failed to update notebook.',
}

function MessagePartNotebookProposal({
  toolPart,
  mode,
}: {
  toolPart: ToolUIPart
  mode: NotebookProposalMode
}) {
  const { state, input, output } = toolPart
  const { addToolApprovalResponse } = useMessageActionsContext()

  if (state === 'input-streaming') {
    return (
      <div className="my-4 mx-4 rounded-lg border bg-surface-75 heading-meta h-9 px-3 text-foreground-light flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        {NOTEBOOK_DRAFTING_LABEL[mode]}
      </div>
    )
  }

  if (state === 'output-error') {
    return <p className="text-xs text-danger px-4">{NOTEBOOK_FAILED_LABEL[mode]}</p>
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

function MessagePartOpenPullRequest({ toolPart }: { toolPart: ToolUIPart }) {
  const { state, input, output } = toolPart
  const { addToolApprovalResponse } = useMessageActionsContext()

  if (state === 'input-streaming') return <MessagePartTool toolPart={toolPart} />
  if (state === 'output-error') {
    return <p className="text-xs text-danger">Failed to open pull request.</p>
  }

  const parsedInput = openPullRequestInputSchema.safeParse(input)
  if (!parsedInput.success) return null
  const parsedOutput = openPullRequestOutputSchema.safeParse(output)
  const { confirmState, onApprove, onDeny } = getManualToolApprovalHandlers({
    state,
    approval: toolPart.approval,
    addToolApprovalResponse,
  })

  return (
    <PullRequestRenderer
      {...parsedInput.data}
      url={parsedOutput.success ? parsedOutput.data.url : undefined}
      number={parsedOutput.success ? parsedOutput.data.number : undefined}
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
  DeployEdgeFunction: MessagePartDeployEdgeFunction,
  NotebookProposal: MessagePartNotebookProposal,
  OpenPullRequest: MessagePartOpenPullRequest,
} as const

export function MessagePartSwitcher({
  part,
}: {
  part: NonNullable<VercelMessage['parts']>[number]
}) {
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
    case 'tool-search_repo':
    case 'tool-read_repo_file':
    case 'tool-write_repo_file': {
      return <MessagePart.Tool toolPart={part} />
    }
    case 'reasoning':
      return <MessagePart.Reasoning reasoningPart={part} />
    case 'text':
      return <MessagePart.Text textPart={part} />

    case 'tool-execute_sql': {
      return <MessagePart.ExecuteSql toolPart={part} />
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
    case 'tool-open_pull_request': {
      return <MessagePart.OpenPullRequest toolPart={part} />
    }

    case 'source-url':
    case 'source-document':
    case 'file':
    default:
      return null
  }
}
