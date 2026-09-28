import type { DynamicToolUIPart, ToolUIPart, UIMessage } from 'ai'
import { describe, expect, it, vi } from 'vitest'

import {
  areMessagePartsEqual,
  getCompactPartLabel,
  getCompactPartStatus,
  getMessagePartKind,
  getRunningToolGroupHeader,
  getToolGroupSummary,
  groupMessageParts,
  isUnfinishedBlockPart,
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
const tool = (name: string, input: unknown = {}): MessagePart => ({
  type: `tool-${name}`,
  toolCallId: `${name}-1`,
  state: 'output-available',
  input,
  output: {},
})
const inputStreamingTool = (name: string): MessagePart => ({
  type: `tool-${name}`,
  toolCallId: `${name}-1`,
  state: 'input-streaming',
  input: undefined,
})
const executingTool = (name: string): MessagePart => ({
  type: `tool-${name}`,
  toolCallId: `${name}-1`,
  state: 'input-available',
  input: {},
})
const failedTool = (name: string): MessagePart => ({
  type: `tool-${name}`,
  toolCallId: `${name}-1`,
  state: 'output-error',
  input: {},
  errorText: 'Boom',
})
const streamingReasoning: MessagePart = { type: 'reasoning', state: 'streaming', text: '' }
const dynamicTool = (toolName: string, input: unknown = {}): MessagePart => ({
  type: 'dynamic-tool',
  toolName,
  toolCallId: `${toolName}-1`,
  state: 'output-available',
  input,
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

  it('treats report, notebook and self-hosted lookups as compact', () => {
    expect(getMessagePartKind(tool('list_notebooks'))).toBe('compact')
    expect(getMessagePartKind(tool('get_notebook'))).toBe('compact')
    expect(getMessagePartKind(tool('list_reports'))).toBe('compact')
    expect(getMessagePartKind(tool('get_report'))).toBe('compact')
    expect(getMessagePartKind(tool('list_databases'))).toBe('compact')
    expect(getMessagePartKind(tool('getSchemaTables'))).toBe('compact')
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

describe('isUnfinishedBlockPart', () => {
  it('flags block calls whose input is still streaming', () => {
    expect(isUnfinishedBlockPart(inputStreamingTool('execute_sql'))).toBe(true)
    expect(isUnfinishedBlockPart(inputStreamingTool('create_notebook'))).toBe(true)
  })

  it('flags query_logs while it waits on the server', () => {
    expect(isUnfinishedBlockPart(executingTool('query_logs'))).toBe(true)
  })

  it('leaves calls waiting on the user or already finished alone', () => {
    expect(isUnfinishedBlockPart(executingTool('execute_sql'))).toBe(false)
    expect(isUnfinishedBlockPart(tool('execute_sql'))).toBe(false)
    expect(isUnfinishedBlockPart(text('Done'))).toBe(false)
  })
})

describe('getCompactPartStatus', () => {
  it('treats unfinished parts as running only while their message streams', () => {
    const executing = executingTool('search_docs')
    expect(getCompactPartStatus(executing, true)).toBe('running')
    expect(getCompactPartStatus(executing, false)).toBe('interrupted')
    expect(getCompactPartStatus(inputStreamingTool('search_docs'), true)).toBe('running')
    expect(getCompactPartStatus(streamingReasoning, true)).toBe('running')
    expect(getCompactPartStatus(streamingReasoning, false)).toBe('interrupted')
  })

  it('reports finished and failed calls whether or not the message streams', () => {
    expect(getCompactPartStatus(tool('search_docs'), true)).toBe('done')
    expect(getCompactPartStatus(reasoning(), true)).toBe('done')
    expect(getCompactPartStatus(failedTool('search_docs'), false)).toBe('failed')
  })
})

describe('getCompactPartLabel', () => {
  it('labels reasoning by its status', () => {
    expect(getCompactPartLabel(streamingReasoning, 'running')).toEqual({ action: 'Thinking...' })
    expect(getCompactPartLabel(reasoning(), 'done')).toEqual({ action: 'Reasoned' })
    expect(getCompactPartLabel(streamingReasoning, 'interrupted')).toEqual({
      action: 'Response interrupted',
    })
  })

  it('describes what a tool call does in each status', () => {
    const part = tool('list_policies')
    expect(getCompactPartLabel(part, 'running')).toEqual({ action: 'Checking policies...' })
    expect(getCompactPartLabel(part, 'done')).toEqual({ action: 'Checked policies' })
    expect(getCompactPartLabel(part, 'failed')).toEqual({ action: 'Unable to check policies' })
    expect(getCompactPartLabel(part, 'interrupted')).toEqual({ action: 'Response interrupted' })
  })

  it('adds what the call looks at when its input says', () => {
    const part = tool('list_policies', { schemas: ['public', 'auth'] })
    expect(getCompactPartLabel(part, 'done')).toEqual({
      action: 'Checked policies',
      detail: 'in public, auth',
    })
    // The ellipsis follows the detail so the label reads as one phrase
    expect(getCompactPartLabel(part, 'running')).toEqual({
      action: 'Checking policies',
      detail: 'in public, auth...',
    })
  })

  it('pulls the search phrase out of a docs query', () => {
    const part = dynamicTool('search_docs', {
      graphql_query: '{ searchDocs(query: "row level security", limit: 5) { nodes { title } } }',
    })
    expect(getCompactPartLabel(part, 'done')).toEqual({
      action: 'Searched docs',
      detail: 'for "row level security"',
    })
    expect(
      getCompactPartLabel(dynamicTool('search_docs', { graphql_query: '{ schema }' }), 'done')
    ).toEqual({ action: 'Searched docs' })
  })

  it('names the knowledge topic being loaded', () => {
    expect(getCompactPartLabel(tool('load_knowledge', { name: 'rls' }), 'done')).toEqual({
      action: 'Read up',
      detail: 'on RLS',
    })
  })

  it('falls back to a readable tool name for unknown tools', () => {
    expect(getCompactPartLabel(dynamicTool('get_project_url'), 'done')).toEqual({
      action: 'Ran get project url',
    })
    expect(getCompactPartLabel(tool('getSomethingNew'), 'running')).toEqual({
      action: 'Running get something new...',
    })
  })
})

describe('getRunningToolGroupHeader', () => {
  it('shows a tool call while it executes', () => {
    const parts = [reasoning(), executingTool('list_policies')]
    expect(getRunningToolGroupHeader(parts)).toEqual({ action: 'Checking policies...' })
  })

  it('goes back to thinking once the call finishes', () => {
    expect(getRunningToolGroupHeader([reasoning(), tool('list_policies')])).toEqual({
      action: 'Thinking...',
    })
    expect(
      getRunningToolGroupHeader([reasoning(), tool('list_policies'), streamingReasoning])
    ).toEqual({ action: 'Thinking...' })
  })

  it('keeps showing a parallel call that is still executing', () => {
    const parts = [executingTool('list_policies'), tool('search_docs')]
    expect(getRunningToolGroupHeader(parts)).toEqual({ action: 'Checking policies...' })
  })

  it('shows thinking before anything has arrived', () => {
    expect(getRunningToolGroupHeader([])).toEqual({ action: 'Thinking...' })
  })
})

describe('getToolGroupSummary', () => {
  it('lists what the tool calls did, without repeats', () => {
    expect(
      getToolGroupSummary([
        reasoning(),
        tool('search_docs'),
        reasoning(),
        tool('search_docs'),
        tool('list_policies'),
      ])
    ).toEqual({ action: 'Searched docs and checked policies' })
  })

  it('names a single tool call', () => {
    expect(getToolGroupSummary([reasoning(), tool('search_docs')])).toEqual({
      action: 'Searched docs',
    })
  })

  it('counts the rest after two', () => {
    expect(
      getToolGroupSummary([
        tool('search_docs'),
        tool('list_policies'),
        tool('get_active_incidents'),
        dynamicTool('list_tables'),
      ])
    ).toEqual({ action: 'Searched docs, checked policies, and 2 more' })
  })

  it('leaves out calls that did not finish', () => {
    expect(getToolGroupSummary([tool('search_docs'), failedTool('list_policies')])).toEqual({
      action: 'Searched docs',
    })
  })

  it('describes how the group ended when no call finished', () => {
    expect(getToolGroupSummary([reasoning()])).toEqual({ action: 'Reasoned' })
    expect(getToolGroupSummary([failedTool('list_policies')])).toEqual({
      action: 'Unable to check policies',
    })
    expect(getToolGroupSummary([reasoning(), executingTool('search_docs')])).toEqual({
      action: 'Response interrupted',
    })
  })
})
