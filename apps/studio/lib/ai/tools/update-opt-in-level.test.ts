import type { ToolUIPart } from 'ai'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { sanitizeContractPart } from './registry'
import { contract } from './update-opt-in-level'
import { createTool } from './update-opt-in-level.server'

const executeOptions = { toolCallId: 'test', messages: [], context: {} }

describe('update_opt_in_level contract', () => {
  it.each([
    ['schema_and_log_and_data', 'schema', undefined],
    ['schema', 'schema', undefined],
    ['schema', 'schema_and_log', 'schema_and_log'],
    ['schema', undefined, undefined],
  ] as const)('at level %s, requested %s is stored as %s', (level, requested, stored) => {
    const parsed = contract
      .createInputSchema({ aiOptInLevel: level })
      .parse({ requiredLevel: requested })
    expect(parsed).toEqual({ levelWhenAsked: level, requiredLevel: stored })
  })

  it('builds the tool with the per-request input schema', () => {
    const tool = createTool({ aiOptInLevel: 'schema_and_log_and_data' })
    expect(tool.inputSchema).not.toBe(contract.inputSchema)
    const parsed = (tool.inputSchema as z.ZodType).parse({ requiredLevel: 'schema' })
    expect(parsed).toEqual({ levelWhenAsked: 'schema_and_log_and_data' })
  })

  it.each([
    ['schema', 'schema_and_log_and_data', false],
    ['schema_and_log_and_data', 'schema', true],
    ['schema', 'schema', true],
    ['schema', undefined, undefined],
  ] as const)(
    'level %s after approval, stored required %s gives sufficient %s',
    async (level, requiredLevel, sufficient) => {
      const tool = createTool({ aiOptInLevel: level })
      if (!tool.execute) throw new Error('execute is undefined')

      const result = await tool.execute({ levelWhenAsked: 'schema', requiredLevel }, executeOptions)

      expect(tool.needsApproval).toBe(true)
      expect(result).toMatchObject({
        levelAfterReview: level,
        ...(sufficient !== undefined && { sufficient }),
      })
      if (sufficient === false) expect(result).toHaveProperty('status')
      else expect(result).not.toHaveProperty('status')
    }
  )

  describe('sanitizeContractPart', () => {
    const part = {
      type: 'tool-update_opt_in_level',
      toolCallId: 'call-1',
      state: 'output-available',
      input: {},
      output: { levelAfterReview: 'schema_and_log', sufficient: true },
    } as ToolUIPart

    it('round-trips a valid output', () => {
      expect(sanitizeContractPart(part, 'schema')?.output).toEqual(part.output)
    })

    it('drops an invalid output', () => {
      const invalid = { ...part, output: { levelAfterReview: 'everything' } } as ToolUIPart
      expect(sanitizeContractPart(invalid, 'schema')?.output).toBe(undefined)
    })
  })
})
