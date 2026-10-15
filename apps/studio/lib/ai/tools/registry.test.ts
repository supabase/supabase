import type { ToolUIPart } from 'ai'
import { describe, expect, expectTypeOf, it } from 'vitest'

import { sanitizeContractPart, type StudioUIMessage } from './registry'

describe('TOOL_CONTRACTS', () => {
  it('types contract tool parts on StudioUIMessage', () => {
    type Part = Extract<
      StudioUIMessage['parts'][number],
      { type: 'tool-update_notebook'; state: 'output-available' }
    >
    expectTypeOf<Part['input']>().toHaveProperty('expected_updated_at')
    expectTypeOf<Part['output']>().toHaveProperty('name')
  })
})

describe('sanitizeContractPart', () => {
  const part = {
    type: 'tool-update_notebook',
    toolCallId: 'call-1',
    state: 'output-available',
    input: {},
    output: {
      id: 'notebook-1',
      name: 'Signup funnel',
      previous_content: { schema_version: 1, cells: [] },
    },
  } as ToolUIPart

  it('drops previous_content from the model output on history replay', () => {
    expect(sanitizeContractPart(part, 'schema')?.output).toEqual({
      id: 'notebook-1',
      name: 'Signup funnel',
    })
  })

  it('drops an output that does not match the schema', () => {
    expect(sanitizeContractPart({ ...part, output: 'oops' } as ToolUIPart, 'schema')?.output).toBe(
      undefined
    )
  })

  it('returns undefined for tools without a contract', () => {
    expect(
      sanitizeContractPart({ ...part, type: 'tool-execute_sql' } as ToolUIPart, 'schema')
    ).toBe(undefined)
  })
})
