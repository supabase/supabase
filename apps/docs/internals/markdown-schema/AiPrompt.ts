type HandlerContext = {
  children: string
}

/**
 * Serializes `<AiPrompt>` for markdown export. Expression children
 * (`{"..."}`) are skipped by the markdown pipeline, so the body may be
 * empty; always keep the title for parity with PromptPanel export.
 */
export const AiPrompt = ({ children }: HandlerContext): string => {
  const body = children.trim()
  return body ? `**AI Prompt**\n\n${body}` : '**AI Prompt**'
}
