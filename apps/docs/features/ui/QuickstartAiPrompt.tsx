'use client'

import prompts from '~/data/quickstart-prompts.json'

import { AiPrompt } from './AiPrompt'

type QuickstartAiPromptProps = {
  /** Quickstart filename stem, e.g. `nextjs`, `expo-react-native`. */
  framework: string
}

/**
 * Looks up the framework prompt from {@link ~/data/quickstart-prompts.json}
 * and renders {@link AiPrompt}. Keeps prompt text out of MDX so UI and
 * markdown export share one data source.
 */
function QuickstartAiPrompt({ framework }: QuickstartAiPromptProps) {
  const prompt = prompts[framework as keyof typeof prompts]
  if (!prompt) {
    throw new Error(`Unknown quickstart prompt framework: ${framework}`)
  }
  return <AiPrompt prompt={prompt} />
}

export { QuickstartAiPrompt }
export type { QuickstartAiPromptProps }
