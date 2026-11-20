import { z } from 'zod'

import type { ToolContract } from './types'
import { isOptInLevelAtLeast, optInLevelSchema } from '@/lib/ai/opt-in-level'

/** What the model sends. */
const modelInputSchema = z.object({
  requiredLevel: z
    .enum(['schema', 'schema_and_log', 'schema_and_log_and_data'])
    .optional()
    .describe(
      'The lowest opt-in level that unlocks what you need: `schema` for table and column metadata, `schema_and_log` for logs, `schema_and_log_and_data` for query results. Omit it when the user just wants to review or change the setting, for example to lower it.'
    ),
})

/**
 * Input as stored on the message. `levelWhenAsked` is the org's level when the call was made.
 * Optional because older chats may lack it.
 */
const storedInputSchema = modelInputSchema.extend({
  levelWhenAsked: optInLevelSchema.optional(),
})

type StoredInput = z.infer<typeof storedInputSchema>

const outputSchema = z.object({
  levelAfterReview: optInLevelSchema,
  sufficient: z.boolean().optional(),
  status: z.string().optional(),
})

type Output = z.infer<typeof outputSchema>

export const contract = {
  name: 'update_opt_in_level',
  description:
    'Asks the user to review or change the organization-wide AI opt-in level. Call it with `requiredLevel` when a tool needs a higher level than the organization has or you need to read query results. Call it without `requiredLevel` whenever the user asks to change the setting, including lowering it. Do not call it again in the same chat after the user skipped it unless they ask.',
  inputSchema: storedInputSchema,
  createInputSchema: ({ aiOptInLevel }) =>
    modelInputSchema.transform(({ requiredLevel }) => ({
      levelWhenAsked: aiOptInLevel,
      ...(requiredLevel && !isOptInLevelAtLeast(aiOptInLevel, requiredLevel) && { requiredLevel }),
    })),
  outputSchema,
  minOptInLevel: null,
  availability: {
    environments: new Set(['platform']),
  },
  needsApproval: true,
  promptGuidance: `- The organization's opt-in level, stated in the conversation context, limits which tools you can use and whether you can read query results. When a tool needs a higher level, or you need the rows from \`execute_sql\`, call \`update_opt_in_level\` with the lowest \`requiredLevel\` that unlocks it. Call it before the blocked tool and wait for the answer, never in the same step as that tool. Do not tell the user you have no access without calling it first. If the current level already allows what you need, use the tool directly; never call \`update_opt_in_level\` for access the organization already has.
- You cannot change the setting yourself, but \`update_opt_in_level\` lets the user do it. Whenever the user asks to review, change, raise, or lower the opt-in level, call it. Omit \`requiredLevel\` unless they asked for a specific access or you need it, so you never pick a level for them. Never tell them to ask an owner or admin before calling it, because the card shows that itself if they lack permission.
- After the result, if the user only asked to change the setting, say in one short sentence what the level is now and stop. If they had another request, report the level in one short sentence, then call the tool you needed again and continue (approving does not re-run earlier queries). Do not call \`update_opt_in_level\` again just to confirm it.
- Only an explicit skip of \`update_opt_in_level\` means the user declined. Do not request that level again in this chat unless they ask. Answer without that data and suggest alternatives.`,
  toModelOutput: (output) => output,
} as const satisfies ToolContract<StoredInput, Output>
