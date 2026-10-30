import { toolFromContract } from './tool-from-contract'
import type { ToolFactory } from './types'
import { contract } from './update-opt-in-level'
import { isOptInLevelAtLeast } from '@/lib/ai/opt-in-level'

export const createTool: ToolFactory<typeof contract> = (ctx) =>
  toolFromContract(contract, ctx, async ({ requiredLevel }) => {
    const { aiOptInLevel } = ctx
    const sufficient = !requiredLevel || isOptInLevelAtLeast(aiOptInLevel, requiredLevel)
    return {
      levelAfterReview: aiOptInLevel,
      ...(requiredLevel && { sufficient }),
      ...(!sufficient && {
        status: `The opt-in level is still below the requested ${requiredLevel}. If you still need that access, call update_opt_in_level again.`,
      }),
    }
  })
