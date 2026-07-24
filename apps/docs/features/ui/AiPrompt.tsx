'use client'

import { quickstartPrompts, type QuickstartPromptFramework } from '~/data/quickstart-prompts.data'
import { Sparkles } from 'lucide-react'

import { Prompt, PromptContent, PromptCopy, PromptPanel, PromptTitle } from './PromptPanel'

type AiPromptProps = {
  /** Quickstart filename stem; looks up text from `quickstartPrompts`. */
  id: QuickstartPromptFramework | string
}

/**
 * MDX-facing wrapper around {@link PromptPanel}. Composes the compound
 * children in this client module so detection does not cross the RSC
 * boundary (where child types arrive as `react.lazy` and the panel
 * would otherwise render nothing).
 *
 * Prompt text lives in `~/data/quickstart-prompts.data`. Markdown export
 * intentionally omits this component (HTML-only copy panel).
 */
function AiPrompt({ id }: AiPromptProps) {
  const prompt = quickstartPrompts[id as QuickstartPromptFramework]
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
