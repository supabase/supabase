import prompts from '../../data/quickstart-prompts.json'

/**
 * Serializes `<QuickstartAiPrompt framework="…" />` for markdown export.
 * Reads the same JSON as the React component so export and UI stay in sync.
 */
export const QuickstartAiPrompt = ({
  props,
}: {
  props: Record<string, unknown>
  children: string
}): string => {
  const framework = String(props.framework ?? '').trim()
  const body = (framework ? prompts[framework as keyof typeof prompts] : undefined)?.trim() ?? ''
  return body ? `**AI Prompt**\n\n${body}` : '**AI Prompt**'
}
