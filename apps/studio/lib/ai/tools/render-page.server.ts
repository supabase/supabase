import { z } from 'zod'

import { findGeneratedPageScriptSyntaxErrors } from './generated-page-script-check'
import { contract } from './render-page'
import { approvalGatedToolFromContract } from './tool-from-contract'
import type { ApprovalGatedToolFactory } from './types'

/**
 * The contract's schema plus a server-only syntax check of the page's inline scripts. The
 * renderer parses with the contract's schema alone: it runs in the browser, and a page that
 * reached it has already passed this check.
 */
export const renderPageToolInputSchema = contract.inputSchema.superRefine((value, ctx) => {
  for (const message of findGeneratedPageScriptSyntaxErrors(value.html)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['html'], message })
  }
})

export const createTool: ApprovalGatedToolFactory<typeof contract> = (ctx) => ({
  ...approvalGatedToolFromContract(
    contract,
    ctx,
    // Deliberately inert: approval, SQL promotion, and execution all happen on the client.
    // Returning a constant keeps results out of the model's context by construction rather
    // than by convention.
    async () => ({ status: 'ready' as const })
  ),
  inputSchema: renderPageToolInputSchema,
})
