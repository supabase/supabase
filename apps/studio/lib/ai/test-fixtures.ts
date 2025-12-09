import type { ToolUIPart, UIMessage } from 'ai'

export function createUserMessage(content: string, id = 'user-msg-1'): UIMessage {
  return {
    id,
    role: 'user',
    parts: [
      {
        type: 'text',
        text: content,
      },
    ],
  }
}

export function createAssistantTextMessage(content: string, id = 'assistant-msg-1'): UIMessage {
  return {
    id,
    role: 'assistant',
    parts: [
      {
        type: 'text',
        text: content,
      },
    ],
  }
}

export function createAssistantMessageWithExecuteSqlTool(
  query: string,
  results: Array<Record<string, any>> = [{ id: 1, name: 'test' }],
  id = 'assistant-tool-msg-1'
): UIMessage {
  return {
    id,
    role: 'assistant',
    parts: [
      {
        type: 'text',
        text: "I'll run that SQL query for you.",
      },
      {
        type: 'tool-execute_sql',
        state: 'output-available',
        toolCallId: 'call-123',
        input: { sql: query },
        output: results,
      } satisfies ToolUIPart,
    ],
  }
}

export function createAssistantMessageWithMultipleTools(
  id = 'assistant-multi-tool-msg-1'
): UIMessage {
  return {
    id,
    role: 'assistant',
    parts: [
      {
        type: 'text',
        text: 'Let me check the database structure and run some queries.',
      },
      {
        type: 'tool-execute_sql',
        state: 'output-available',
        toolCallId: 'call-456',
        input: { sql: 'SELECT * FROM users LIMIT 5' },
        output: [
          { id: 1, email: 'user1@example.com' },
          { id: 2, email: 'user2@example.com' },
        ],
      } satisfies ToolUIPart,
      {
        type: 'tool-execute_sql',
        state: 'output-available',
        toolCallId: 'call-789',
        toolName: 'execute_sql',
        input: { sql: 'DESCRIBE users' },
        output: [
          { column: 'id', type: 'integer', nullable: false },
          { column: 'email', type: 'varchar', nullable: false },
        ],
      } as ToolUIPart,
    ],
  }
}

export function createLongConversation(): Array<UIMessage> {
  return [
    createUserMessage('Show me all users', 'msg-1'),
    createAssistantMessageWithExecuteSqlTool('SELECT * FROM users', [{ id: 1 }], 'msg-2'),
    createUserMessage('How many users are there?', 'msg-3'),
    createAssistantMessageWithExecuteSqlTool(
      'SELECT COUNT(*) FROM users',
      [{ count: 100 }],
      'msg-4'
    ),
    createUserMessage('Show me the schema', 'msg-5'),
    createAssistantTextMessage("Here's the database schema...", 'msg-6'),
    createUserMessage('Create a new table', 'msg-7'),
    createAssistantMessageWithExecuteSqlTool(
      'CREATE TABLE posts (id SERIAL PRIMARY KEY)',
      [],
      'msg-8'
    ),
    createUserMessage('Add some data', 'msg-9'),
    createAssistantMessageWithExecuteSqlTool(
      "INSERT INTO posts (title) VALUES ('Test')",
      [],
      'msg-10'
    ),
  ]
}
