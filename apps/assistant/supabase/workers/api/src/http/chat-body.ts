import { z } from 'zod'

import { assistantSupportMetadataSchema } from './contracts'

export const chatTriggerSchema = z.enum([
  'submit-message',
  'regenerate-message',
  'approval-response',
])

/**
 * Canonical body plus Studio `DefaultChatTransport` compatibility
 * (`{ messages: UIMessage[] }` — last item is treated as `message`).
 */
export const chatBodySchema = z
  .object({
    revision: z.number().int().nonnegative(),
    requestId: z.string().uuid(),
    supportMetadata: assistantSupportMetadataSchema.optional(),
    message: z.unknown().optional(),
    messages: z.array(z.unknown()).max(100).optional(),
    trigger: chatTriggerSchema.optional(),
    messageId: z.string().optional(),
    model: z.string().optional(),
    supportMode: z.boolean().optional(),
  })
  .refine((body) => body.message != null || (body.messages != null && body.messages.length > 0), {
    message: 'message or messages is required',
  })

export type ChatBody = z.infer<typeof chatBodySchema>
