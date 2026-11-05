'use client'

import { aiPrompts, type AiPromptId } from '~/data/ai-prompts.data'
import { useSendTelemetryEvent } from '~/lib/telemetry'
import { type DocsAiPromptSource } from 'common/telemetry-constants'
import {
  Prompt,
  PromptContent,
  PromptCopy,
  PromptMarkdown,
  PromptPanel,
  PromptTitle,
} from 'ui-patterns/PromptPanel'

type AiPromptProps = {
  /** Looks up prompt text from `aiPrompts`. */
  id: AiPromptId | string
  /** Includes the prompt body in generated guide Markdown. */
  includeInMarkdown?: boolean
  /** Surface reported when the prompt is copied. */
  telemetry: { source: DocsAiPromptSource }
}

/**
 * MDX-facing wrapper around {@link PromptPanel}. Composes the compound
 * children in this client module so detection does not cross the RSC
 * boundary (where child types arrive as `react.lazy` and the panel
 * would otherwise render nothing).
 *
 * Prompt text lives in `~/data/ai-prompts.data`. Markdown export is opt-in so
 * existing quickstarts do not duplicate their instructions in bulk exports.
 */
function AiPrompt({ id, telemetry }: AiPromptProps) {
  const sendTelemetryEvent = useSendTelemetryEvent()
  const prompt = aiPrompts[id as AiPromptId]
  if (!prompt) {
    throw new Error(`Unknown AiPrompt id: ${id}`)
  }

  return (
    <PromptPanel
      onCopied={(tab) =>
        sendTelemetryEvent({
          action: 'docs_ai_prompt_copied',
          properties: { source: telemetry.source, tab, promptId: id },
        })
      }
    >
      <Prompt value="prompt" expandable>
        <PromptTitle>Agent Prompt</PromptTitle>
        <PromptCopy>{prompt}</PromptCopy>
        <PromptContent>
          <PromptMarkdown>{prompt}</PromptMarkdown>
        </PromptContent>
      </Prompt>
    </PromptPanel>
  )
}

export { AiPrompt }
export type { AiPromptProps }
