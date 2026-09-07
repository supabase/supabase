import { z } from 'zod'

export const assistantMeSchema = z.object({
  user_id: z.string(),
  connections: z.array(z.object({ org_slug: z.string() })),
})

// Studio's v1 integration response validation. Permission values are opaque to this client.
const supportStatus = z.enum(['bot_active', 'escalated', 'user_resolved', 'bot_resolved'])
export const assistantSupportMetadataSchema = z.object({
  subject: z.string(),
  category: z.string(),
  severity: z.string(),
  allowSupportAccess: z.boolean(),
  organizationSlug: z.string().optional(),
  projectRef: z.string().optional(),
  library: z.string().optional(),
  affectedServices: z.string().optional(),
  browserInformation: z.string().optional(),
  frontConversationId: z.string().optional(),
  threadRef: z.string().optional(),
  isSupportChat: z.literal(true),
  lifecycleStatus: supportStatus,
  pendingLifecycleStatus: supportStatus.optional(),
  lifecycleClosedAt: z.string().optional(),
  lastSyncedMessageCount: z.number().int().nonnegative(),
  isSyncing: z.boolean(),
  isLifecycleSyncing: z.boolean(),
})

export const assistantConversationSchema = z.object({
  id: z.string().uuid(),
  revision: z.number().int().nonnegative(),
  name: z.string(),
  project_ref: z.string(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
  support_metadata: assistantSupportMetadataSchema.nullish(),
  branched_from: z.object({ chat_id: z.string().uuid(), message_id: z.string() }).nullish(),
})
export const assistantConversationResponseSchema = z.object({
  conversation: assistantConversationSchema,
  messages: z.array(z.unknown()).optional(),
  nextCursor: z.number().int().positive().nullish(),
})
export const assistantConversationListSchema = z.object({
  conversations: z.array(assistantConversationSchema),
})

export const assistantProjectPermissionsSchema = z.object({
  selection: z.string(),
  hasConsented: z.boolean(),
  consentVersion: z.number().int().positive(),
  options: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
        description: z.string(),
        disabled: z.boolean(),
      })
    )
    .min(1),
  notice: z.string().optional(),
  capabilities: z.object({ includeContext: z.boolean() }),
})
