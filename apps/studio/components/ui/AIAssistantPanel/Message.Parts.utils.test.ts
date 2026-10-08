import type { DynamicToolUIPart, ToolUIPart, UIMessage } from 'ai'
import { describe, expect, it, vi } from 'vitest'

import {
  areMessagePartsEqual,
  getCompactPartLabel,
  getToolGroupSummary,
  groupMessageParts,
  type CompactPart,
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

const reasoning = (state: 'streaming' | 'done' = 'done'): CompactPart => ({
  type: 'reasoning',
  state,
  text: 'Thinking about it',
})
const tool = (name: string, input: unknown = {}): CompactPart => ({
  type: `tool-${name}`,
  toolCallId: name,
  state: 'output-available',
  input,
  output: {},
})
const runningTool = (name: string, input: unknown = {}): CompactPart => ({
  type: `tool-${name}`,
  toolCallId: name,
  state: 'input-available',
  input,
})
const failedTool = (name: string): CompactPart => ({
  type: `tool-${name}`,
  toolCallId: name,
  state: 'output-error',
  input: {},
  errorText: 'Boom',
})
const mcpTool = (toolName: string): CompactPart => ({
  type: 'dynamic-tool',
  toolName,
  toolCallId: toolName,
  state: 'output-available',
  input: {},
  output: {},
})
const text = (value: string): UIMessage['parts'][number] => ({ type: 'text', text: value })

describe('groupMessageParts', () => {
  it('folds consecutive compact parts and starts a new group after each block', () => {
    const parts = [
      reasoning(),
      tool('search_docs'),
      text('Let me check'),
      mcpTool('list_tables'),
      mcpTool('query_logs'),
      tool('execute_sql'),
      reasoning(),
    ]

    expect(groupMessageParts(parts)).toEqual([
      { type: 'tool-group', parts: [parts[0], parts[1]], groupIndex: 0 },
      { type: 'part', part: parts[2], partIndex: 2 },
      { type: 'tool-group', parts: [parts[3]], groupIndex: 1 },
      { type: 'part', part: parts[4], partIndex: 4 },
      { type: 'part', part: parts[5], partIndex: 5 },
      { type: 'tool-group', parts: [parts[6]], groupIndex: 2 },
    ])
  })

  it('drops parts that render nothing so they do not split a group', () => {
    const [first, second, third] = [reasoning(), tool('search_docs'), reasoning()]
    const parts = [
      first,
      { type: 'step-start' as const },
      second,
      tool('rename_chat'),
      text(' '),
      third,
    ]

    expect(groupMessageParts(parts)).toEqual([
      { type: 'tool-group', parts: [first, second, third], groupIndex: 0 },
    ])
  })
})

describe('getCompactPartLabel', () => {
  it.each([
    { part: reasoning('streaming'), label: 'Thinking...' },
    { part: reasoning(), label: 'Reasoned' },
    { part: runningTool('list_policies'), label: 'Checking policies...' },
    { part: tool('list_policies'), label: 'Checked policies' },
    { part: failedTool('list_policies'), label: 'Checking policies failed' },
    {
      part: runningTool('list_policies', { schemas: ['public'] }),
      label: 'Checking policies in public...',
    },
    {
      part: tool('list_policies', { schemas: ['public', 'auth'] }),
      label: 'Checked policies in public, auth',
    },
    {
      part: tool('search_docs', {
        graphql_query: '{ searchDocs(query: "row level security") { nodes { title } } }',
      }),
      label: 'Searched docs for "row level security"',
    },
    { part: tool('search_docs', { graphql_query: '{ schema }' }), label: 'Searched docs' },
    { part: tool('load_knowledge', { name: 'rls' }), label: 'Read up on RLS' },
    { part: mcpTool('get_project_url'), label: 'Ran get project url' },
  ])('labels "$label"', ({ part, label }) => {
    expect(getCompactPartLabel(part)).toBe(label)
  })
})

describe('getToolGroupSummary', () => {
  it.each([
    { parts: [reasoning(), tool('search_docs')], summary: 'Searched docs' },
    {
      parts: [tool('search_docs'), reasoning(), tool('search_docs'), tool('list_policies')],
      summary: 'Searched docs and checked policies',
    },
    {
      parts: [
        tool('search_docs'),
        tool('list_policies'),
        tool('list_reports'),
        mcpTool('list_tables'),
      ],
      summary: 'Searched docs, checked policies, and 2 more',
    },
    { parts: [tool('search_docs'), failedTool('list_policies')], summary: 'Searched docs' },
    // Nothing finished
    { parts: [reasoning()], summary: 'Reasoned' },
    { parts: [failedTool('list_policies')], summary: 'Checking policies failed' },
    { parts: [reasoning(), runningTool('search_docs')], summary: 'Response interrupted' },
  ])('summarizes "$summary"', ({ parts, summary }) => {
    expect(getToolGroupSummary(parts)).toBe(summary)
  })
})
