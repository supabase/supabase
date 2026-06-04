import type { CodeContext } from './types'

export function buildMessageTemplate(codeContext: CodeContext | null, isEnabled = true) {
  return (query: string) => {
    if (!codeContext || !isEnabled) return query

    return [
      `The user is reading Supabase docs at ${codeContext.pageUrl}.`,
      `They selected this ${codeContext.language} code snippet:`,
      '```' + codeContext.language,
      codeContext.content,
      '```',
      '',
      `Question: ${query}`,
    ].join('\n')
  }
}
