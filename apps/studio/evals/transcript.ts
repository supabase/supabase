import type { StepResult, ToolSet } from 'ai'

export type Transcript = {
  /** The user's prompt for this eval case. Always available locally — no reconstruction needed. */
  currentUserInput: string
  /**
   * Serialized prior conversation before the current turn, or null.
   */
  priorConversation: string | null
  /** Text-only serialization of the assistant's turn: prose only, no tool call markers. */
  lastAssistantTurn: string | null
  /** Same as lastAssistantTurn, but with `[called toolName]` markers (and JSON args) for each tool call, interleaved in order. */
  lastAssistantTurnWithToolInputs: string | null
}

/**
 * Builds a Transcript directly from the AI SDK's step history — no trace/network round-trip.
 * Mirrors the marker format the old trace.getThread()-based serialization used
 * (`[called toolName]\n<json args>`), so scorer prompts don't need to change:
 * only text and tool-call content parts are represented; reasoning/source/file/tool-result/
 * tool-error parts are skipped, exactly as the old serializeContentBlock did.
 */
export function buildTranscript(
  currentUserInput: string,
  steps: ReadonlyArray<StepResult<ToolSet>>
): Transcript {
  const renderStep = (step: StepResult<ToolSet>, includeToolInputs: boolean): string =>
    step.content
      .flatMap((part) => {
        if (part.type === 'text') return part.text ? [part.text] : []
        if (part.type === 'tool-call') {
          const marker = `[called ${part.toolName}]`
          return [includeToolInputs ? `${marker}\n${JSON.stringify(part.input, null, 2)}` : marker]
        }
        return []
      })
      .join('\n')

  const joinSteps = (includeToolInputs: boolean): string | null => {
    const rendered = steps
      .map((step) => renderStep(step, includeToolInputs))
      .filter((s) => s.length > 0)
    return rendered.length > 0 ? rendered.join('\n\n') : null
  }

  return {
    currentUserInput,
    priorConversation: null,
    lastAssistantTurn: joinSteps(false),
    lastAssistantTurnWithToolInputs: joinSteps(true),
  }
}
