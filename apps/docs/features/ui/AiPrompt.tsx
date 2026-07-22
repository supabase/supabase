'use client'

import { Sparkles } from 'lucide-react'

import { Prompt, PromptContent, PromptCopy, PromptPanel, PromptTitle } from './PromptPanel'

type AiPromptProps = {
  /** Plain-text prompt copied to the clipboard and shown in the panel. */
  children: string
}

/**
 * MDX-facing wrapper around {@link PromptPanel}. Composes the compound
 * children in this client module so detection does not cross the RSC
 * boundary (where child types arrive as `react.lazy` and the panel
 * would otherwise render nothing).
 */
function AiPrompt({ children }: AiPromptProps) {
  return (
    <PromptPanel>
      <Prompt value="prompt" expandable>
        <PromptTitle icon={<Sparkles />}>AI Prompt</PromptTitle>
        <PromptCopy>{children}</PromptCopy>
        <PromptContent>{children}</PromptContent>
      </Prompt>
    </PromptPanel>
  )
}

export { AiPrompt }
export type { AiPromptProps }
