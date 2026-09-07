import { z } from 'zod'

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
