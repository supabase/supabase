import type { ModelMessage, ToolUIPart, UIMessage } from 'ai'
import { describe, expect, it } from 'vitest'

import {
  hideToolErrorsFromModel,
  prepareMessagesForModel,
} from './generate-assistant-response.utils'
import { NO_DATA_ERROR } from './tools/execute-sql-output'
import { encodeNotebookToolError, NotebookToolError } from './tools/notebook-tool-error'

function assistantMessage(parts: UIMessage['parts']): UIMessage {
  return { id: 'msg-1', role: 'assistant', parts }
}

function toolPart(overrides: Partial<ToolUIPart>): ToolUIPart {
  return {
    type: 'tool-update_notebook',
    toolCallId: 'call-1',
    state: 'output-available',
    input: {},
    ...overrides,
  } as ToolUIPart
}

describe('prepareMessagesForModel', () => {
  it('filters out a plain output-error tool part', () => {
    const messages = [
      assistantMessage([toolPart({ state: 'output-error', errorText: 'Network error' })]),
    ]

    const result = prepareMessagesForModel(messages, 'schema')

    expect(result[0].parts).toEqual([])
  })

  it('keeps a stale-update_notebook conflict and rewrites errorText to the plain message', () => {
    const error = new NotebookToolError('Notebook changed since expected_updated_at', {
      exposeToAssistant: true,
    })
    const messages = [
      assistantMessage([
        toolPart({ state: 'output-error', errorText: encodeNotebookToolError(error)! }),
      ]),
    ]

    const result = prepareMessagesForModel(messages, 'schema')

    expect(result[0].parts).toEqual([
      toolPart({ state: 'output-error', errorText: 'Notebook changed since expected_updated_at' }),
    ])
  })

  it('still filters out an unrelated update_notebook output-error', () => {
    const messages = [
      assistantMessage([
        toolPart({ state: 'output-error', errorText: 'Unexpected upstream failure' }),
      ]),
    ]

    const result = prepareMessagesForModel(messages, 'schema')

    expect(result[0].parts).toEqual([])
  })

  it('still filters out JSON-shaped output-error text lacking the notebook_tool_error tag', () => {
    const messages = [
      assistantMessage([
        toolPart({
          state: 'output-error',
          errorText: JSON.stringify({
            exposeToAssistant: true,
            message: 'not a real notebook error',
          }),
        }),
      ]),
    ]

    const result = prepareMessagesForModel(messages, 'schema')

    expect(result[0].parts).toEqual([])
  })

  it('exposes any tool part carrying a validly-tagged NotebookToolError, not just update_notebook', () => {
    const error = new NotebookToolError('Notebook changed since expected_updated_at', {
      exposeToAssistant: true,
    })
    const messages = [
      assistantMessage([
        toolPart({
          type: 'tool-execute_sql',
          state: 'output-error',
          errorText: encodeNotebookToolError(error)!,
        }),
      ]),
    ]

    const result = prepareMessagesForModel(messages, 'schema')

    expect(result[0].parts).toEqual([
      toolPart({
        type: 'tool-execute_sql',
        state: 'output-error',
        errorText: 'Notebook changed since expected_updated_at',
      }),
    ])
  })

  it('still filters out input-streaming, input-available, and approval-requested parts', () => {
    const messages = [
      assistantMessage([
        toolPart({ state: 'input-streaming' }),
        toolPart({ state: 'input-available' }),
        toolPart({ state: 'approval-requested', approval: { id: 'a1' } } as Partial<ToolUIPart>),
      ]),
    ]

    const result = prepareMessagesForModel(messages, 'schema')

    expect(result[0].parts).toEqual([])
  })

  it('strips update_notebook previous_content before it reaches the model on history replay', () => {
    const messages = [
      assistantMessage([
        toolPart({
          state: 'output-available',
          output: {
            id: 'notebook-1',
            name: 'Signup funnel',
            previous_content: { schema_version: 1, cells: [] },
          },
        }),
      ]),
    ]

    const result = prepareMessagesForModel(messages, 'schema')

    expect(result[0].parts).toEqual([
      toolPart({
        state: 'output-available',
        output: { id: 'notebook-1', name: 'Signup funnel' },
      }),
    ])
  })

  it('keeps non-tool parts untouched', () => {
    const messages = [assistantMessage([{ type: 'text', text: 'hello' }])]

    const result = prepareMessagesForModel(messages, 'schema')

    expect(result[0].parts).toEqual([{ type: 'text', text: 'hello' }])
  })
})

describe('hideToolErrorsFromModel', () => {
  const toolError = (toolName: string): ModelMessage => ({
    role: 'tool',
    content: [
      {
        type: 'tool-result',
        toolCallId: 'call-1',
        toolName,
        output: { type: 'error-text', value: 'duplicate key (email)=(a@b.c)' },
      },
    ],
  })

  it('hides execute_sql errors below the data level', () => {
    expect(hideToolErrorsFromModel([toolError('execute_sql')], 'schema')).toEqual([
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'call-1',
            toolName: 'execute_sql',
            output: { type: 'error-text', value: NO_DATA_ERROR },
          },
        ],
      },
    ])
  })

  it('keeps errors at the data level and from other tools', () => {
    const messages = [toolError('execute_sql'), toolError('search_docs')]

    expect(hideToolErrorsFromModel(messages, 'schema_and_log_and_data')).toEqual(messages)
    expect(hideToolErrorsFromModel([toolError('search_docs')], 'schema')).toEqual([
      toolError('search_docs'),
    ])
  })
})
