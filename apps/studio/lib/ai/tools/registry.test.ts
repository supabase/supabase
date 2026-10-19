import type { ToolUIPart } from 'ai'
import { describe, expect, expectTypeOf, it } from 'vitest'

import { INVALID_NOTEBOOK_RUN_OUTPUT_MESSAGE } from './notebook-run-output'
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
      sanitizeContractPart({ ...part, type: 'tool-list_tables' } as ToolUIPart, 'schema')
    ).toBe(undefined)
  })
})

describe('sanitizeContractPart for run_notebook', () => {
  const output = {
    id: 'notebook-1',
    name: 'Notebook',
    updated_at: '2026-01-01T00:00:00.000Z',
    optInLevel: 'schema_and_log_and_data',
    cells: [
      {
        cell_id: 'db',
        title: 'Database',
        source: 'database',
        status: 'success',
        rows: [{ secret: 'value' }],
      },
    ],
  }
  const part = {
    type: 'tool-run_notebook',
    toolCallId: 'call-2',
    state: 'output-available',
    input: {},
    output,
  } as ToolUIPart

  it('hides rows below the data level and keeps them at the data level', () => {
    const hidden = sanitizeContractPart(part, 'schema')?.output as typeof output
    expect(hidden.cells[0]).not.toHaveProperty('rows')
    expect(sanitizeContractPart(part, 'schema_and_log_and_data')?.output).toEqual(output)
  })

  it('replaces an invalid output with an explanation instead of dropping it', () => {
    expect(sanitizeContractPart({ ...part, output: 'oops' } as ToolUIPart, 'schema')?.output).toBe(
      INVALID_NOTEBOOK_RUN_OUTPUT_MESSAGE
    )
  })
})

describe('notebook mutation contracts', () => {
  it.each(['create_notebook', 'delete_notebook'] as const)(
    '%s output is limited to id and name on replay',
    (name) => {
      const part = {
        type: `tool-${name}`,
        toolCallId: 'call-3',
        state: 'output-available',
        input: {},
        output: { id: 'notebook-1', name: 'Notebook', extra: 'ignored' },
      } as ToolUIPart
      expect(sanitizeContractPart(part, 'schema')?.output).toEqual({
        id: 'notebook-1',
        name: 'Notebook',
      })
    }
  )
})
