import type { ToolUIPart } from 'ai'
import { describe, expect, it } from 'vitest'

import { OPT_IN_LEVELS } from '../opt-in-level'
import { getLegacyToolContract, LEGACY_TOOL_CONTRACTS } from './legacy-tools'
import { REMOTE_TOOL_CONTRACTS, sanitizeContractPart, TOOL_CONTRACTS } from './registry'
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

  it('never shares a name with a registry tool', () => {
    const live = new Set([...Object.keys(TOOL_CONTRACTS), ...Object.keys(REMOTE_TOOL_CONTRACTS)])
    expect(Object.keys(LEGACY_TOOL_CONTRACTS).filter((name) => live.has(name))).toEqual([])
  })

  const gated: [string, unknown[]][] = [
    ['getSchemaTables', [[SCHEMA_ROW], [], 'Failed to fetch schema: boom']],
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

  describe('getRlsKnowledge', () => {
    const SAVED_OUTPUT = `You're a Supabase Postgres expert in writing row level security policies.

          Here are my existing policies:
          Policy Name: "Read own rows"
          Action: PERMISSIVE
          `

    it.each(OPT_IN_LEVELS)('replays only the saved policies at %s', (level) => {
      const replayed = outputOf('getRlsKnowledge', SAVED_OUTPUT, level)
      if (level === 'disabled') {
        expect(replayed).toBe(hiddenAt('getRlsKnowledge', 'disabled'))
        return
      }
      expect(replayed).toBe('Policy Name: "Read own rows"\n          Action: PERMISSIVE')
    })

    it('replaces an invalid output', () => {
      expect(outputOf('getRlsKnowledge', 42, 'schema')).toBe(
        LEGACY_TOOL_CONTRACTS.getRlsKnowledge.outputOnInvalid
      )
    })

    it.each([
      ['has no marker', SAVED_OUTPUT.slice(0, SAVED_OUTPUT.indexOf('Here are my existing'))],
      [
        'has an empty policy list',
        `${SAVED_OUTPUT.slice(0, SAVED_OUTPUT.indexOf('Here are my existing'))}Here are my existing policies:   `,
      ],
    ])('replays a note when the output %s', (_label, output) => {
      expect(outputOf('getRlsKnowledge', output, 'schema')).toBe(
        'No existing policies were found when this tool ran.'
      )
    })

    it('is safe to run on its own result', () => {
      const once = outputOf('getRlsKnowledge', SAVED_OUTPUT, 'schema')
      expect(outputOf('getRlsKnowledge', once, 'schema')).toBe(once)
      const note = 'No existing policies were found when this tool ran.'
      expect(outputOf('getRlsKnowledge', note, 'schema')).toBe(note)
    })
  })

  it.each(OPT_IN_LEVELS)('points getEdgeFunctionKnowledge at load_knowledge at %s', (level) => {
    const replayed = outputOf('getEdgeFunctionKnowledge', 'Stale Edge guidance', level)
    expect(replayed).toContain('`load_knowledge`')
    expect(replayed).toContain('`edge_functions`')
    expect(replayed).not.toContain('Stale Edge guidance')
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
