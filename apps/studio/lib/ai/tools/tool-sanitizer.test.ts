import type { ToolUIPart } from 'ai'
import { describe, expect, test } from 'vitest'

// End of third-party imports

import { prepareMessagesForAPI } from '../message-utils'
import {
  createAssistantMessageWithExecuteSqlTool,
  createAssistantMessageWithMultipleTools,
  createLongConversation,
} from '../test-fixtures'
import { INVALID_NOTEBOOK_RUN_OUTPUT_MESSAGE, type NotebookRunOutput } from './notebook-run-output'
import { NO_DATA_PERMISSIONS, sanitizeMessagePart } from './tool-sanitizer'

const notebookRunPart = {
  type: 'tool-run_notebook',
  state: 'output-available',
  toolCallId: 'run-1',
  input: { id: 'notebook-1', expected_updated_at: '2026-01-01T00:00:00.000Z' },
  output: {
    id: 'notebook-1',
    name: 'Notebook',
    updated_at: '2026-01-01T00:00:00.000Z',
    cells: [
      {
        cell_id: 'db',
        title: 'Database',
        source: 'database',
        status: 'success',
        rows: [{ secret: 'database value' }],
      },
      {
        cell_id: 'logs',
        title: 'Logs',
        source: 'logs',
        status: 'success',
        rows: [{ secret: 'log value' }],
      },
    ],
  },
} as unknown as ToolUIPart

describe('messages are sanitized based on opt-in level', () => {
  test('notebook runs sanitize database and log rows independently', () => {
    const schemaOutput = (sanitizeMessagePart(notebookRunPart, 'schema') as ToolUIPart)
      .output as NotebookRunOutput
    const logOutput = (sanitizeMessagePart(notebookRunPart, 'schema_and_log') as ToolUIPart)
      .output as NotebookRunOutput
    const dataOutput = (
      sanitizeMessagePart(notebookRunPart, 'schema_and_log_and_data') as ToolUIPart
    ).output as NotebookRunOutput

    expect(schemaOutput.cells[0].rows).toBeUndefined()
    expect(schemaOutput.cells[1].rows).toBeUndefined()
    expect(logOutput.cells[0].rows).toBeUndefined()
    expect(logOutput.cells[1].rows).toEqual([{ secret: 'log value' }])
    expect(dataOutput.cells[0].rows).toEqual([{ secret: 'database value' }])
    expect(dataOutput.cells[1].rows).toEqual([{ secret: 'log value' }])
  })

  test.each([
    ['a non-object output', 'client-controlled output'],
    ['an object without cells', { status: 'privacy message' }],
    [
      'a cell with an untrusted source label',
      {
        id: 'notebook-1',
        name: 'Notebook',
        updated_at: '2026-01-01T00:00:00.000Z',
        cells: [
          {
            cell_id: 'db',
            title: 'Database',
            source: 'untrusted-source',
            status: 'success',
            rows: [{ secret: 'database value' }],
          },
        ],
      },
    ],
  ])('notebook runs fail closed for %s', (_description, output) => {
    const malformedPart = { ...notebookRunPart, output } as ToolUIPart

    expect((sanitizeMessagePart(malformedPart, 'schema_and_log') as ToolUIPart).output).toBe(
      INVALID_NOTEBOOK_RUN_OUTPUT_MESSAGE
    )
  })

  test('messages are sanitized at disabled level', () => {
    const messages = [
      createAssistantMessageWithExecuteSqlTool('SELECT email FROM users', [
        { email: 'test@example.com' },
      ]),
    ]

    // Prepare messages as frontend would
    const preparedMessages = prepareMessagesForAPI(messages)

    // Sanitize messages as API endpoint would
    const processedMessages = preparedMessages.map((msg) => {
      if (msg.role === 'assistant' && msg.parts) {
        const processedParts = msg.parts.map((part) => {
          return sanitizeMessagePart(part, 'disabled')
        })

        return { ...msg, parts: processedParts }
      }
      return msg
    })

    const output = (processedMessages[0].parts[1] as ToolUIPart).output
    expect(output).toMatch(NO_DATA_PERMISSIONS)
  })

  test('messages are sanitized at schema level', () => {
    const messages = [
      createAssistantMessageWithExecuteSqlTool('SELECT email FROM users', [
        { email: 'test@example.com' },
      ]),
    ]

    // Prepare messages as frontend would
    const preparedMessages = prepareMessagesForAPI(messages)

    // Sanitize messages as API endpoint would
    const processedMessages = preparedMessages.map((msg) => {
      if (msg.role === 'assistant' && msg.parts) {
        const processedParts = msg.parts.map((part) => {
          return sanitizeMessagePart(part, 'schema')
        })

        return { ...msg, parts: processedParts }
      }
      return msg
    })

    const output = (processedMessages[0].parts[1] as ToolUIPart).output
    expect(output).toMatch(NO_DATA_PERMISSIONS)
  })

  test('messages are sanitized at schema and log level', () => {
    const messages = [
      createAssistantMessageWithExecuteSqlTool('SELECT email FROM users', [
        { email: 'test@example.com' },
      ]),
    ]

    // Prepare messages as frontend would
    const preparedMessages = prepareMessagesForAPI(messages)

    // Sanitize messages as API endpoint would
    const processedMessages = preparedMessages.map((msg) => {
      if (msg.role === 'assistant' && msg.parts) {
        const processedParts = msg.parts.map((part) => {
          return sanitizeMessagePart(part, 'schema_and_log')
        })

        return { ...msg, parts: processedParts }
      }
      return msg
    })

    const output = (processedMessages[0].parts[1] as ToolUIPart).output
    expect(output).toMatch(NO_DATA_PERMISSIONS)
  })

  test('messages are not sanitized at data level', () => {
    const messages = [
      createAssistantMessageWithExecuteSqlTool('SELECT email FROM users', [
        { email: 'test@example.com' },
      ]),
    ]

    // Prepare messages as frontend would
    const preparedMessages = prepareMessagesForAPI(messages)

    // Sanitize messages as API endpoint would
    const processedMessages = preparedMessages.map((msg) => {
      if (msg.role === 'assistant' && msg.parts) {
        const processedParts = msg.parts.map((part) => {
          return sanitizeMessagePart(part, 'schema_and_log_and_data')
        })

        return { ...msg, parts: processedParts }
      }
      return msg
    })

    const output = (processedMessages[0].parts[1] as ToolUIPart).output
    expect(output).toEqual([{ email: 'test@example.com' }])
  })

  test('multiple tool parts in message are sanitized', () => {
    const messages = [createAssistantMessageWithMultipleTools()]

    // Prepare messages as frontend would
    const preparedMessages = prepareMessagesForAPI(messages)

    // Sanitize messages as API endpoint would
    const processedMessages = preparedMessages.map((msg) => {
      if (msg.role === 'assistant' && msg.parts) {
        const processedParts = msg.parts.map((part) => {
          return sanitizeMessagePart(part, 'schema')
        })

        return { ...msg, parts: processedParts }
      }
      return msg
    })

    const parts = processedMessages[0].parts
    parts.forEach((part) => {
      if (part.type.startsWith('tool')) {
        const tool = part as ToolUIPart
        expect(tool.output).toMatch(NO_DATA_PERMISSIONS)
      }
    })
  })

  test('long message chain is sanitized', () => {
    const messages = createLongConversation()

    // Prepare messages as frontend would
    const preparedMessages = prepareMessagesForAPI(messages)

    // Sanitize messages as API endpoint would
    const processedMessages = preparedMessages.map((msg) => {
      if (msg.role === 'assistant' && msg.parts) {
        const processedParts = msg.parts.map((part) => {
          return sanitizeMessagePart(part, 'schema')
        })

        return { ...msg, parts: processedParts }
      }
      return msg
    })

    processedMessages.forEach((msg) => {
      if (msg.role === 'assistant' && msg.parts) {
        const parts = msg.parts
        parts.forEach((part) => {
          if (part.type.startsWith('tool')) {
            const tool = part as ToolUIPart
            expect(tool.output).toMatch(NO_DATA_PERMISSIONS)
          }
        })
      }
    })
  })
})
