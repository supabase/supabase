'use client'

import { BookOpen, PenLine, Search } from 'lucide-react'
import {
  ChainOfThoughtStep,
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
  type StepStatus,
} from 'ui-patterns/AgentUi'

interface DocsAiReasoningPanelProps {
  hasStartedStreaming: boolean
  isComplete: boolean
  isLoading: boolean
  isResponding: boolean
}

function getStepStatus(isComplete: boolean, isActive: boolean): StepStatus {
  if (isActive) return 'active'
  if (isComplete) return 'complete'
  return 'pending'
}

function DocsAiReasoningPanel({
  isLoading,
  isResponding,
  hasStartedStreaming,
  isComplete,
}: DocsAiReasoningPanelProps) {
  const isActive = isLoading || isResponding
  if (!isActive && !isComplete) return null

  const isThinking = isLoading || (isResponding && !hasStartedStreaming)

  const searchStatus = isComplete
    ? 'complete'
    : getStepStatus(!isLoading && isResponding, isLoading)
  const reviewStatus = isComplete
    ? 'complete'
    : getStepStatus(hasStartedStreaming, !isLoading && isResponding && !hasStartedStreaming)
  const composeStatus = isComplete
    ? 'complete'
    : getStepStatus(hasStartedStreaming && !isResponding, isResponding && hasStartedStreaming)

  return (
    <Reasoning isStreaming={isThinking}>
      <ReasoningTrigger
        getThinkingMessage={(streaming, duration) => {
          if (streaming || duration === 0) return 'Thinking...'
          if (duration === undefined) return 'Finished thinking'
          return `Thought for ${duration} seconds`
        }}
      />
      <ReasoningContent>
        <div className="space-y-0.5 border-l border-default pl-3">
          <ChainOfThoughtStep
            icon={Search}
            label="Searching documentation"
            description="Finding relevant sections in Supabase docs."
            status={searchStatus}
          />
          <ChainOfThoughtStep
            icon={BookOpen}
            label="Reviewing retrieved sections"
            description="Analyzing matching documentation pages."
            status={reviewStatus}
          />
          <ChainOfThoughtStep
            icon={PenLine}
            label="Composing answer"
            description="Generating a response from the retrieved context."
            status={composeStatus}
          />
        </div>
      </ReasoningContent>
    </Reasoning>
  )
}

export { DocsAiReasoningPanel }
