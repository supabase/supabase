import type { UIMessage } from 'ai'
import { describe, expect, test } from 'vitest'

import {
  containsLogsSnippets,
  formatAttachedSnippets,
  hasPendingToolApproval,
  isReadOnlySelect,
  resolvePendingToolApprovalsAsDenied,
} from './AIAssistant.utils'

const createMessageWithPart = (
  part: UIMessage['parts'][number],
  role: UIMessage['role'] = 'assistant'
) =>
  [
    {
      id: `${role}-msg-1`,
      role,
      parts: [part],
    },
  ] as UIMessage[]

const pendingSqlApprovalPart = {
  type: 'tool-execute_sql',
  toolCallId: 'call-1',
  state: 'approval-requested',
  input: { sql: 'select 1', label: 'Test query' },
  approval: { id: 'approval-1' },
} satisfies UIMessage['parts'][number]

describe('AIAssistant.utils.ts:isReadOnlySelect', () => {
  test('Should return true for SQL that only contains SELECT operation', () => {
    const sql = 'select * from countries where id > 100 order by id asc;'
    const result = isReadOnlySelect(sql)
    expect(result).toBe(true)
  })
  test('Should return false for SQL that contains INSERT operation', () => {
    const sql = `insert into countries (id, name) values (1, 'hello');`
    const result = isReadOnlySelect(sql)
    expect(result).toBe(false)
  })
  test('Should return false for SQL that contains UPDATE operation', () => {
    const sql = `update countries set name = 'hello' where id = 2;`
    const result = isReadOnlySelect(sql)
    expect(result).toBe(false)
  })
  test('Should return false for SQL that contains DELETE operation', () => {
    const sql = `delete from countries where id = 2;`
    const result = isReadOnlySelect(sql)
    expect(result).toBe(false)
  })
  test('Should return false for SQL that contains ALTER operation', () => {
    const sql = `alter table countries drop column id if exists;`
    const result = isReadOnlySelect(sql)
    expect(result).toBe(false)
  })
  test('Should return false for SQL that contains DROP operation', () => {
    const sql = `drop table if exists countries;`
    const result = isReadOnlySelect(sql)
    expect(result).toBe(false)
  })
  test('Should return false for SQL that contains CREATE operation', () => {
    const sql = `create schema test_schema;`
    const result = isReadOnlySelect(sql)
    expect(result).toBe(false)
  })
  test('Should return false for SQL that contains REPLACE operation', () => {
    const sql = `create or replace view test_view as select * from countries where id > 500;`
    const result = isReadOnlySelect(sql)
    expect(result).toBe(false)
  })
  test('Should return false for SQL that calls a function not whitelisted', () => {
    const sql = `select create_new_user();`
    const result = isReadOnlySelect(sql)
    expect(result).toBe(false)
  })
  test('Should return true for SQL that calls a function that is whitelisted', () => {
    const sql = `select count(select * from countries);`
    const result = isReadOnlySelect(sql)
    expect(result).toBe(true)
  })
  test('Should return false for SQL that contains a write operation with a read operation', () => {
    const sql1 = `select count(select * from countries); create schema joshen;`
    const result1 = isReadOnlySelect(sql1)
    expect(result1).toBe(false)
    const sql2 = `create schema joshen; select count(select * from countries);`
    const result2 = isReadOnlySelect(sql2)
    expect(result2).toBe(false)
  })
})

describe('AIAssistant.utils.ts:hasPendingToolApproval', () => {
  test('Should return true when an assistant message has a pending tool approval', () => {
    const messages = createMessageWithPart(pendingSqlApprovalPart)

    expect(hasPendingToolApproval(messages)).toBe(true)
  })

  test('Should return false when approval has already been answered', () => {
    const messages = createMessageWithPart({
      type: 'tool-execute_sql',
      toolCallId: 'call-1',
      state: 'approval-responded',
      input: { sql: 'select 1', label: 'Test query' },
      approval: { id: 'approval-1', approved: true },
    })

    expect(hasPendingToolApproval(messages)).toBe(false)
  })

  test('Should ignore non-assistant messages', () => {
    const messages = createMessageWithPart(pendingSqlApprovalPart, 'user')

    expect(hasPendingToolApproval(messages)).toBe(false)
  })

  test('Should return true for dynamic tool approvals', () => {
    const messages = createMessageWithPart({
      type: 'dynamic-tool',
      toolName: 'execute_sql',
      toolCallId: 'call-1',
      state: 'approval-requested',
      input: { sql: 'select 1', label: 'Test query' },
      approval: { id: 'approval-1' },
    })

    expect(hasPendingToolApproval(messages)).toBe(true)
  })
})

describe('AIAssistant.utils.ts:resolvePendingToolApprovalsAsDenied', () => {
  test('Should convert pending approvals into denied outputs', () => {
    const messages = createMessageWithPart(pendingSqlApprovalPart)

    const resolvedMessages = resolvePendingToolApprovalsAsDenied(messages)
    const [part] = resolvedMessages[0].parts

    expect(part).toMatchObject({
      state: 'output-denied',
      approval: {
        id: 'approval-1',
        approved: false,
        reason: 'Skipped because the user sent a follow-up message.',
      },
    })
  })

  test('Should leave completed approvals unchanged', () => {
    const messages = createMessageWithPart({
      type: 'tool-execute_sql',
      toolCallId: 'call-1',
      state: 'output-available',
      input: { sql: 'select 1', label: 'Test query' },
      output: [],
      approval: { id: 'approval-1', approved: true },
    })

    expect(resolvePendingToolApprovalsAsDenied(messages)).toEqual(messages)
  })
})

describe('containsLogsSnippets', () => {
  test('is true when an attached query is a logs query', () => {
    expect(
      containsLogsSnippets([{ label: 'Current Query', content: 'select 1', source: 'logs' }])
    ).toBe(true)
  })

  test('is false for a database query', () => {
    expect(
      containsLogsSnippets([{ label: 'Current Query', content: 'select 1', source: 'database' }])
    ).toBe(false)
  })

  test('is false once nothing is attached', () => {
    expect(containsLogsSnippets([])).toBe(false)
    expect(containsLogsSnippets(undefined)).toBe(false)
  })

  test('ignores plain string attachments, which carry no source', () => {
    expect(containsLogsSnippets(['select 1'])).toBe(false)
  })

  test('is true when only some of several attachments are logs queries', () => {
    expect(
      containsLogsSnippets([
        'select 1',
        { label: 'Current Query', content: 'select 2', source: 'database' },
        { label: 'Other', content: 'select 3', source: 'logs' },
      ])
    ).toBe(true)
  })
})

describe('formatAttachedSnippets', () => {
  test('fences a database query as sql', () => {
    expect(
      formatAttachedSnippets([{ label: 'Current Query', content: 'select 1', source: 'database' }])
    ).toBe('```sql\nselect 1\n```')
  })

  // The fence is how the model tells which attachment is ClickHouse. It also keeps a
  // logs query out of MessageMarkdown's `sql` branch, which offers to run the block
  // against Postgres and brands it with untrustedSql.
  test('fences a logs query as clickhouse', () => {
    expect(
      formatAttachedSnippets([
        {
          label: 'Current Query',
          content: "select count() from logs where source = 'edge_logs'",
          source: 'logs',
        },
      ])
    ).toBe("```clickhouse\nselect count() from logs where source = 'edge_logs'\n```")
  })

  test('labels each attachment with its own dialect', () => {
    expect(
      formatAttachedSnippets([
        { label: 'A', content: 'select 1', source: 'database' },
        { label: 'B', content: 'select 2', source: 'logs' },
      ])
    ).toBe('```sql\nselect 1\n```\n```clickhouse\nselect 2\n```')
  })

  test('falls back to sql for a plain string attachment', () => {
    expect(formatAttachedSnippets(['select 1'])).toBe('```sql\nselect 1\n```')
  })
})
