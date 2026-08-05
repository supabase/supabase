import type { UIMessage } from 'ai'
import z from 'zod'

export const assistantMessageMetadataSchema = z
  .object({
    /**
     * Whether any query attached to this message is a logs (ClickHouse) query. A boolean
     * rather than a single source, because one message can attach several queries and
     * only some of them may target the logs backend — the per-attachment dialect is
     * carried by each snippet's own fence in the message text.
     */
    containsLogsSnippets: z.boolean().optional(),
  })
  .optional()

export type AssistantMessageMetadata = z.infer<typeof assistantMessageMetadataSchema>

/**
 * Whether any user message in the conversation attached a logs query.
 *
 * Parsed rather than cast — `UIMessage['metadata']` is `unknown`, and metadata can come
 * from a chat persisted by an older build.
 */
export function messagesIncludeLogsSnippets(messages: UIMessage[]): boolean {
  return messages.some((message) => {
    if (message.role !== 'user') return false
    const metadata = assistantMessageMetadataSchema.safeParse(message.metadata)
    return metadata.success && metadata.data?.containsLogsSnippets === true
  })
}
