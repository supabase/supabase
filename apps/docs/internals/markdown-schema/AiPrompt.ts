import { aiPrompts, type AiPromptId } from '~/data/ai-prompts.data'

type HandlerContext = {
  props: Record<string, unknown>
}

export function AiPrompt({ props }: HandlerContext): string {
  const includeInMarkdown = props.includeInMarkdown === true || props.includeInMarkdown === 'true'

  if (!includeInMarkdown) return ''

  const id = String(props.id ?? '')
  const prompt = aiPrompts[id as AiPromptId]

  if (!prompt) {
    throw new Error(`Unknown AiPrompt id: ${id}`)
  }

  return `**AI Prompt**\n\n\`\`\`text\n${prompt}\n\`\`\``
}
