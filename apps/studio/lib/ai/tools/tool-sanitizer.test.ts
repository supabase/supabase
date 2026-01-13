import type { ToolUIPart } from 'ai'
import { describe, expect, test } from 'vitest'
// End of third-party imports

import { prepareMessagesForAPI } from '../message-utils'
import {
  createAssistantMessageWithExecuteSqlTool,
  createAssistantMessageWithMultipleTools,
  createLongConversation,
} from '../test-fixtures'
import { NO_DATA_PERMISSIONS, sanitizeMessagePart } from './tool-sanitizer'

describe('messages are sanitized based on opt-in level', () => {
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
