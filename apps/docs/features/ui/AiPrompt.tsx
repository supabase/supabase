'use client'

import { Sparkles } from 'lucide-react'

import { Prompt, PromptContent, PromptCopy, PromptPanel, PromptTitle } from './PromptPanel'

type AiPromptProps = {
  /** Plain-text prompt copied to the clipboard and shown in the panel. */
  prompt: string
}

/**
 * MDX-facing wrapper around {@link PromptPanel}. Composes the compound
 * children in this client module so detection does not cross the RSC
 * boundary (where child types arrive as `react.lazy` and the panel
 * would otherwise render nothing).
 *
 * The prompt is a prop (not children) so the markdown-export schema can
 * read it — expression children are skipped by the guides markdown pipeline.
 */
function AiPrompt({ prompt }: AiPromptProps) {
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
