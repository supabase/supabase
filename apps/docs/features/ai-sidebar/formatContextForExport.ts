import type { Message } from 'ui-patterns/CommandMenu/prepackaged/ai'
import { MessageRole } from 'ui-patterns/CommandMenu/prepackaged/ai'

import type { CodeContext } from './types'

function formatAssistantContent(content: string, sources?: { url: string }[]) {
  let text = content.trim()
  if (sources?.length) {
    text += `\n\nSources:\n${sources.map((s) => `- ${s.url}`).join('\n')}`
  }
  return text
}

export function formatContextForExport({
  codeContext,
  isCodeContextEnabled = true,
  messages,
}: {
  codeContext: CodeContext | null
  isCodeContextEnabled?: boolean
  messages: Message[]
}) {
  const exportedAt = new Date().toISOString()
  const pageUrl = codeContext?.pageUrl ?? 'https://supabase.com/docs'

  const lines = [
    '# Supabase Docs — AI Context Export',
    '',
    '## Source',
    `- Page: ${pageUrl}`,
    `- Exported: ${exportedAt}`,
    '',
  ]

  if (codeContext && isCodeContextEnabled) {
    lines.push(
      `## Code snippet (${codeContext.language}, ${codeContext.lineCount} lines)`,
      '',
      '```' + codeContext.language,
      codeContext.content,
      '```',
      ''
    )
  }

  const conversationMessages = messages.filter(
    (m) => m.role === MessageRole.User || m.role === MessageRole.Assistant
  )

  if (conversationMessages.length > 0) {
    lines.push('## Conversation', '')

    for (const message of conversationMessages) {
      if (message.role === MessageRole.User) {
        lines.push('### User', message.content.trim(), '')
      } else if (message.content.trim()) {
        lines.push(
          '### Assistant',
          formatAssistantContent(message.content, message.sources),
          ''
        )
      }
    }
  }

  lines.push(
    '---',
    'Continue this task in your editor. The code snippet and conversation above are the full context.'
  )

  return lines.join('\n')
}
