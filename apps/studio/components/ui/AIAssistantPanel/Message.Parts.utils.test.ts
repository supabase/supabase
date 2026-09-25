import type { DynamicToolUIPart, ToolUIPart, UIMessage } from 'ai'
import { describe, expect, it, vi } from 'vitest'

import {
  areMessagePartsEqual,
  getCompactPartLabel,
  getMessagePartKind,
  getToolGroupHeader,
  groupMessageParts,
} from './Message.Parts.utils'

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

type MessagePart = UIMessage['parts'][number]

const reasoning = (text = 'Thinking about it'): MessagePart => ({
  type: 'reasoning',
  state: 'done',
  text,
})
const text = (value: string): MessagePart => ({ type: 'text', text: value })
const stepStart: MessagePart = { type: 'step-start' }
const tool = (name: string): MessagePart => ({
  type: `tool-${name}`,
  toolCallId: `${name}-1`,
  state: 'output-available',
  input: {},
  output: {},
})
const dynamicTool = (toolName: string): MessagePart => ({
  type: 'dynamic-tool',
  toolName,
  toolCallId: `${toolName}-1`,
  state: 'output-available',
  input: {},
  output: {},
})

describe('getMessagePartKind', () => {
  it('treats reasoning and lookup tools as compact', () => {
    expect(getMessagePartKind(reasoning())).toBe('compact')
    expect(getMessagePartKind(tool('search_docs'))).toBe('compact')
    expect(getMessagePartKind(tool('list_policies'))).toBe('compact')
    expect(getMessagePartKind(tool('get_active_incidents'))).toBe('compact')
    expect(getMessagePartKind(tool('load_knowledge'))).toBe('compact')
    expect(getMessagePartKind(dynamicTool('list_tables'))).toBe('compact')
  })

  it('treats text and rich tool results as blocks', () => {
    expect(getMessagePartKind(text('Here are your tables'))).toBe('block')
    expect(getMessagePartKind(tool('execute_sql'))).toBe('block')
    expect(getMessagePartKind(tool('deploy_edge_function'))).toBe('block')
    expect(getMessagePartKind(tool('create_notebook'))).toBe('block')
    expect(getMessagePartKind(tool('run_notebook'))).toBe('block')
    expect(getMessagePartKind(dynamicTool('query_logs'))).toBe('block')
  })

  it('hides parts that render nothing', () => {
    expect(getMessagePartKind(stepStart)).toBe('hidden')
    expect(getMessagePartKind(text(''))).toBe('hidden')
    expect(getMessagePartKind(text('\n\n  '))).toBe('hidden')
    expect(getMessagePartKind(tool('rename_chat'))).toBe('hidden')
  })
})

describe('groupMessageParts', () => {
  it('returns nothing for a message without parts', () => {
    expect(groupMessageParts([])).toEqual([])
  })

  it('folds consecutive compact parts into one group', () => {
    const parts = [reasoning(), tool('search_docs'), reasoning(), tool('list_policies')]

    expect(groupMessageParts(parts)).toEqual([{ type: 'tool-group', parts, groupIndex: 0 }])
  })

  it('wraps a single compact part in a group', () => {
    const part = reasoning()
    expect(groupMessageParts([part])).toEqual([
      { type: 'tool-group', parts: [part], groupIndex: 0 },
    ])
  })

  it('does not let step markers or hidden tools split a group', () => {
    const first = reasoning('first')
    const second = tool('search_docs')
    const third = reasoning('third')

    expect(
      groupMessageParts([
        stepStart,
        first,
        stepStart,
        second,
        tool('rename_chat'),
        text(' '),
        third,
      ])
    ).toEqual([{ type: 'tool-group', parts: [first, second, third], groupIndex: 0 }])
  })

  it('starts a new group after each block part', () => {
    const intro = text('Let me check')
    const sql = tool('execute_sql')
    const answer = text('Done')
    const parts = [
      reasoning('a'),
      intro,
      reasoning('b'),
      tool('search_docs'),
      sql,
      reasoning('c'),
      answer,
    ]

    expect(groupMessageParts(parts)).toEqual([
      { type: 'tool-group', parts: [parts[0]], groupIndex: 0 },
      { type: 'part', part: intro, partIndex: 1 },
      { type: 'tool-group', parts: [parts[2], parts[3]], groupIndex: 1 },
      { type: 'part', part: sql, partIndex: 4 },
      { type: 'tool-group', parts: [parts[5]], groupIndex: 2 },
      { type: 'part', part: answer, partIndex: 6 },
    ])
  })

  it('keeps block parts separate even when adjacent', () => {
    const parts = [text('One'), text('Two')]

    expect(groupMessageParts(parts)).toEqual([
      { type: 'part', part: parts[0], partIndex: 0 },
      { type: 'part', part: parts[1], partIndex: 1 },
    ])
  })
})

describe('getCompactPartLabel', () => {
  it('labels reasoning by whether it is still streaming', () => {
    expect(getCompactPartLabel({ type: 'reasoning', state: 'streaming', text: '' })).toEqual({
      action: 'Thinking...',
    })
    expect(getCompactPartLabel(reasoning())).toEqual({ action: 'Reasoned' })
  })

  it('labels tool calls with the tool name', () => {
    expect(getCompactPartLabel(tool('search_docs'))).toEqual({
      action: 'Ran',
      toolName: 'search_docs',
    })
    expect(getCompactPartLabel(dynamicTool('list_tables'))).toEqual({
      action: 'Ran',
      toolName: 'list_tables',
    })
  })

  it('labels a tool call whose input is still streaming as running', () => {
    const part: MessagePart = {
      type: 'tool-search_docs',
      toolCallId: 'search_docs-1',
      state: 'input-streaming',
      input: undefined,
    }
    expect(getCompactPartLabel(part)).toEqual({ action: 'Running', toolName: 'search_docs' })
  })
})

describe('getToolGroupHeader', () => {
  const parts = [reasoning(), tool('search_docs'), reasoning(), tool('list_policies')]

  it('mirrors the latest tool call while running collapsed', () => {
    expect(getToolGroupHeader({ parts, isRunning: true, isOpen: false })).toEqual({
      action: 'Ran',
      toolName: 'list_policies',
    })
  })

  it('shows a generic label while running expanded', () => {
    expect(getToolGroupHeader({ parts, isRunning: true, isOpen: true })).toEqual({
      action: 'Working...',
    })
  })

  it('shows a generic label while running without parts', () => {
    expect(getToolGroupHeader({ parts: [], isRunning: true, isOpen: false })).toEqual({
      action: 'Working...',
    })
  })

  it('summarizes the tool count once finished, open or not', () => {
    const summary = { action: 'Worked across 4 tools' }
    expect(getToolGroupHeader({ parts, isRunning: false, isOpen: false })).toEqual(summary)
    expect(getToolGroupHeader({ parts, isRunning: false, isOpen: true })).toEqual(summary)
  })

  it('uses the singular for a single tool', () => {
    expect(getToolGroupHeader({ parts: [reasoning()], isRunning: false, isOpen: false })).toEqual({
      action: 'Worked across 1 tool',
    })
  })
})
