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
  needsApproval: true,
  toModelOutput: (output) => output,
} as const satisfies ToolContract<StoredInput, Output>
