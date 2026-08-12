'use client'

import { aiPrompts, type AiPromptId } from '~/data/ai-prompts.data'
import { Sparkles } from 'lucide-react'

import { Prompt, PromptContent, PromptCopy, PromptPanel, PromptTitle } from './PromptPanel'

type AiPromptProps = {
  /** Looks up prompt text from `aiPrompts`. */
  id: AiPromptId | string
}

/**
 * MDX-facing wrapper around {@link PromptPanel}. Composes the compound
 * children in this client module so detection does not cross the RSC
 * boundary (where child types arrive as `react.lazy` and the panel
 * would otherwise render nothing).
 *
 * Prompt text lives in `~/data/ai-prompts.data`. Markdown export
 * intentionally omits this component (HTML-only copy panel).
 */
function AiPrompt({ id }: AiPromptProps) {
  const prompt = aiPrompts[id as AiPromptId]
  if (!prompt) {
    throw new Error(`Unknown AiPrompt id: ${id}`)
  }

  return (
    <PromptPanel>
      <Prompt value="prompt" expandable>
        <PromptTitle icon={<Sparkles />}>AI Prompt</PromptTitle>
        <PromptCopy>{prompt}</PromptCopy>
        <PromptContent>{prompt}</PromptContent>
      </Prompt>
    </PromptPanel>
  )
}

export { AiPrompt }
export type { AiPromptProps }
