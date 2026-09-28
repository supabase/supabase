import type { DynamicToolUIPart, ToolUIPart } from 'ai'
import { describe, expect, it, vi } from 'vitest'

import { areMessagePartsEqual } from './Message.Parts.utils'

const completedTool = {
  type: 'tool-execute_sql',
  toolCallId: 'query-1',
  state: 'output-available',
  input: { sql: 'select 1' },
  output: [{ value: 1 }],
} satisfies ToolUIPart

describe('areMessagePartsEqual', () => {
  it.each(['static', 'dynamic'])('does not traverse finalized %s tool output', (kind) => {
    const readRows = vi.fn(() => [{ value: 1 }])
    const output = () => ({
      get rows() {
        return readRows()
      },
    })
    const tool =
      kind === 'static'
        ? completedTool
        : { ...completedTool, type: 'dynamic-tool' as const, toolName: 'query_logs' }

    expect(areMessagePartsEqual({ ...tool, output: output() }, { ...tool, output: output() })).toBe(
      true
    )
    expect(readRows).not.toHaveBeenCalled()
  })

  const changedTools: Array<[string, ToolUIPart | DynamicToolUIPart]> = [
    ['tool identity', { ...completedTool, toolCallId: 'query-2' }],
    ['tool type', { ...completedTool, type: 'tool-query_logs' }],
    ['input', { ...completedTool, input: { sql: 'select 2' } }],
    ['approval', { ...completedTool, approval: { id: 'approval-1', approved: true } }],
    ['metadata', { ...completedTool, toolMetadata: { title: 'Updated title' } }],
    ['preliminary flag', { ...completedTool, preliminary: true }],
    [
      'error state',
      {
        type: 'tool-execute_sql',
        toolCallId: 'query-1',
        state: 'output-error',
        input: completedTool.input,
        errorText: 'Query failed',
      },
    ],
  ]

  it.each(changedTools)('rerenders when %s changes', (_label, next) => {
    expect(areMessagePartsEqual(completedTool, next)).toBe(false)
  })

  it('updates preliminary results before the tool state changes', () => {
    const previous = { ...completedTool, preliminary: true }
    expect(areMessagePartsEqual(previous, { ...previous, output: [{ value: 2 }] })).toBe(false)
  })

  it('renders the final result after preliminary output', () => {
    expect(areMessagePartsEqual({ ...completedTool, preliminary: true }, completedTool)).toBe(false)
  })

  it('checks live text and reasoning state', () => {
    expect(
      areMessagePartsEqual({ type: 'text', text: 'Hello' }, { type: 'text', text: 'Hello again' })
    ).toBe(false)
    expect(
      areMessagePartsEqual(
        { type: 'reasoning', text: '', state: 'streaming' },
        { type: 'reasoning', text: '', state: 'done' }
      )
    ).toBe(false)
  })

  it('keeps identical and cloned unchanged parts memoized', () => {
    expect(areMessagePartsEqual(completedTool, completedTool)).toBe(true)
    const text = { type: 'text' as const, text: 'Hello' }
    expect(areMessagePartsEqual(text, { ...text })).toBe(true)
  })
})
