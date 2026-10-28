import type { ToolUIPart } from 'ai'
import { describe, expect, it } from 'vitest'

import { OPT_IN_LEVELS } from '../opt-in-level'
import { getLegacyToolContract, LEGACY_TOOL_CONTRACTS } from './legacy-tools'
import { sanitizeContractPart } from './registry'
import { sanitizeMessagePart } from './tool-sanitizer'
import type { AiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'

function part(tool: string, output: unknown) {
  return {
    type: `tool-${tool}`,
    toolCallId: 'call-1',
    state: 'output-available',
    input: {},
    output,
  } as ToolUIPart
}

const outputOf = (tool: string, output: unknown, level: AiOptInLevel) =>
  sanitizeContractPart(part(tool, output), level)?.output

const hiddenAt = (tool: string, level: AiOptInLevel) => outputOf(tool, 'x', level)

const SCHEMA_ROW = {
  data: { definitions: [{ id: 16384, sql: 'CREATE TABLE public.todos (id bigint)' }] },
}

describe('legacy tool contracts', () => {
  it('looks up only own keys', () => {
    expect(getLegacyToolContract('getFunctions')).toBe(LEGACY_TOOL_CONTRACTS.getFunctions)
    expect(getLegacyToolContract('toString')).toBeUndefined()
    expect(getLegacyToolContract('execute_sql')).toBeUndefined()
  })

  const gated: [string, unknown[]][] = [
    ['getSchemaTables', [[SCHEMA_ROW], [], 'Failed to fetch schema: boom']],
    ['getRlsKnowledge', ['Row Level Security guidance']],
    ['getFunctions', ['Function: add\nReturn Type: int', '', 'Failed to fetch functions: boom']],
  ]

  describe.each(gated)('%s', (tool, outputs) => {
    it.each(OPT_IN_LEVELS)('gates stored shapes at %s', (level) => {
      const hidden = hiddenAt(tool, 'disabled')
      expect(typeof hidden).toBe('string')
      for (const output of outputs) {
        expect(outputOf(tool, output, level)).toEqual(level === 'disabled' ? hidden : output)
      }
    })

    it('replaces an invalid output', () => {
      const invalid = outputOf(tool, 42, 'schema')
      expect(invalid).toBe(
        LEGACY_TOOL_CONTRACTS[tool as keyof typeof LEGACY_TOOL_CONTRACTS].outputOnInvalid
      )
      expect(typeof invalid).toBe('string')
    })
  })

  it.each([[[null]], [[{ schema: 'public', name: 'todos' }]]])(
    'replaces a malformed getSchemaTables array %j',
    (output) => {
      expect(outputOf('getSchemaTables', output, 'schema')).toBe(
        LEGACY_TOOL_CONTRACTS.getSchemaTables.outputOnInvalid
      )
    }
  )

  it.each(OPT_IN_LEVELS)('shows getEdgeFunctionKnowledge at %s', (level) => {
    expect(outputOf('getEdgeFunctionKnowledge', 'Edge guidance', level)).toBe('Edge guidance')
  })

  it('replaces an invalid getEdgeFunctionKnowledge output', () => {
    expect(outputOf('getEdgeFunctionKnowledge', { a: 1 }, 'schema')).toBe(
      LEGACY_TOOL_CONTRACTS.getEdgeFunctionKnowledge.outputOnInvalid
    )
  })

  it('is reached through sanitizeMessagePart', () => {
    const result = sanitizeMessagePart(part('getFunctions', 'Function: add'), 'disabled')
    expect(result).toMatchObject({ type: 'tool-getFunctions' })
    expect((result as ToolUIPart).output).not.toBe('Function: add')
  })
})
