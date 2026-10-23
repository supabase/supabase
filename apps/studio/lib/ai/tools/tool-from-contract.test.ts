import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { toolFromContract } from './tool-from-contract'
import type { ToolContract } from './types'

describe('toolFromContract createInputSchema', () => {
  const base = {
    name: 'probe',
    description: 'A probe',
    outputSchema: z.object({}),
    minOptInLevel: null,
    needsApproval: false,
    toModelOutput: () => ({}),
  } as const

  it('parses with createInputSchema when the contract has one', () => {
    const perRequest = z.object({}).transform(() => ({ level: 'schema_and_log' }))
    const probe = {
      ...base,
      inputSchema: z.object({ level: z.string() }),
      createInputSchema: () => perRequest,
    } satisfies ToolContract<{ level: string }, object>

    expect(toolFromContract(probe, { aiOptInLevel: 'schema' }, async () => ({})).inputSchema).toBe(
      perRequest
    )
  })

  it('passes the context to createInputSchema', () => {
    let received: unknown
    const probe = {
      ...base,
      inputSchema: z.object({}),
      createInputSchema: (ctx) => {
        received = ctx
        return z.object({})
      },
    } satisfies ToolContract<object, object>

    const ctx = { projectRef: 'ref', aiOptInLevel: 'schema' } as const
    toolFromContract(probe, ctx, async () => ({}))
    expect(received).toBe(ctx)
  })

  it('parses with inputSchema otherwise', () => {
    const inputSchema = z.object({})
    const probe = { ...base, inputSchema } satisfies ToolContract<object, object>

    expect(toolFromContract(probe, { aiOptInLevel: 'schema' }, async () => ({})).inputSchema).toBe(
      inputSchema
    )
  })
})
