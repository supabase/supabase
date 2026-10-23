import { safeSql } from '@supabase/pg-meta'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getOptInTools, getStudioTools } from './studio-tools'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import { NO_DATA_PERMISSIONS } from '@/lib/ai/tools/execute-sql-output'

vi.mock('@/data/sql/execute-sql-mutation', () => ({
  executeSql: vi.fn(),
}))

describe('ai/tools/studio-tools', () => {
  beforeEach(() => {
    vi.mocked(executeSql).mockReset()
  })

  describe('getStudioTools', () => {
    it('should expose exactly the studio tools', () => {
      const tools = getStudioTools({ aiOptInLevel: 'schema' })

      expect(Object.keys(tools).sort()).toEqual([
        'deploy_edge_function',
        'execute_sql',
        'load_knowledge',
        'rename_chat',
      ])
    })

    it('should include logs in the load_knowledge schema', () => {
      const tools = getStudioTools({ aiOptInLevel: 'schema' })
      const schema = tools.load_knowledge.inputSchema

      if (!('safeParse' in schema)) throw new Error('inputSchema has no safeParse')

      expect(schema.safeParse({ name: 'logs' }).success).toBe(true)
      expect(schema.safeParse({ name: 'pg_best_practices' }).success).toBe(true)
      expect(schema.safeParse({ name: 'not_a_topic' }).success).toBe(false)
    })

    it('should return ClickHouse logs knowledge for load_knowledge logs', async () => {
      const tools = getStudioTools({ aiOptInLevel: 'schema' })
      if (!tools.load_knowledge.execute) throw new Error('execute is undefined')

      const result = await tools.load_knowledge.execute(
        { name: 'logs' },
        { toolCallId: 'test', messages: [], context: {} }
      )

      expect(result).toContain('query_logs')
      expect(result).toContain('iso_timestamp_start')
      expect(result).toContain('# Supabase logs SQL (ClickHouse)')
      expect(result).toContain('interactive query cell')
    })

    it('should have rename_chat hand the rename off to the client', async () => {
      const tools = getStudioTools({ aiOptInLevel: 'schema' })
      const renameTool = tools.rename_chat

      if (!renameTool.execute) throw new Error('execute is undefined')
      const result = await renameTool.execute(
        { newName: 'Test Chat' },
        { toolCallId: 'test', messages: [], context: {} }
      )
      expect(result).toEqual({ status: 'Chat request sent to client' })
    })

    it('should validate execute_sql input schema correctly', () => {
      const tools = getStudioTools({ aiOptInLevel: 'schema' })
      const schema = tools.execute_sql.inputSchema

      if (!('safeParse' in schema)) throw new Error('inputSchema has no safeParse')

      // Valid input
      const validInput = {
        sql: safeSql`SELECT * FROM users`,
        label: 'Get users',
        chartConfig: { view: 'table' as const },
        isWriteQuery: false,
      }
      expect(schema.safeParse(validInput).success).toBe(true)

      // Valid chart config
      const validChartInput = {
        sql: safeSql`SELECT count(*) FROM users`,
        label: 'User count',
        chartConfig: { view: 'chart' as const, xAxis: 'date', yAxis: 'count' },
        isWriteQuery: false,
      }
      expect(schema.safeParse(validChartInput).success).toBe(true)

      // Missing required field
      const invalidInput = {
        sql: safeSql`SELECT * FROM users`,
        // missing label, chartConfig, isWriteQuery
      }
      expect(schema.safeParse(invalidInput).success).toBe(false)
    })

    it('should require approval for read and write SQL queries', () => {
      const tools = getStudioTools({ aiOptInLevel: 'schema' })

      expect(tools.execute_sql.needsApproval).toBe(true)
    })

    it('should return execute_sql rows to the UI and sanitize model output without data opt-in', async () => {
      const rows = [{ email: 'test@example.com' }]
      vi.mocked(executeSql).mockResolvedValue({ result: rows })

      const tools = getStudioTools({
        projectRef: 'test-project',
        connectionString: 'encrypted-connection-string',
        aiOptInLevel: 'schema',
      })

      if (!tools.execute_sql.execute) throw new Error('execute is undefined')
      const result = await tools.execute_sql.execute(
        {
          sql: 'SELECT email FROM users',
          label: 'Get emails',
          chartConfig: { view: 'table' },
          isWriteQuery: false,
        },
        { toolCallId: 'test', messages: [], context: {} }
      )

      expect(executeSql).toHaveBeenCalledWith(
        {
          projectRef: 'test-project',
          connectionString: 'encrypted-connection-string',
          sql: 'SELECT email FROM users limit 101;',
        },
        undefined,
        undefined
      )
      expect(result).toEqual({ rows, totalRows: 1, optInLevel: 'schema' })
      expect((tools.execute_sql as any).toModelOutput({ output: result })).toEqual({
        type: 'json',
        value: NO_DATA_PERMISSIONS,
      })
    })

    it('preserves execute_sql errors below the data level', async () => {
      const error = new Error('duplicate key (email)=(test@example.com)')
      vi.mocked(executeSql).mockRejectedValue(error)

      const tools = getStudioTools({
        projectRef: 'test-project',
        connectionString: 'encrypted-connection-string',
        aiOptInLevel: 'schema',
      })

      if (!tools.execute_sql.execute) throw new Error('execute is undefined')
      await expect(
        tools.execute_sql.execute(
          {
            sql: 'INSERT INTO users (email) VALUES (1)',
            label: 'Insert',
            chartConfig: { view: 'table' },
            isWriteQuery: true,
          },
          { toolCallId: 'test', messages: [], context: {} }
        )
      ).rejects.toBe(error)
    })

    it('should return execute_sql rows with data opt-in', async () => {
      const rows = [{ email: 'test@example.com' }]
      vi.mocked(executeSql).mockResolvedValue({ result: rows })

      const tools = getStudioTools({
        projectRef: 'test-project',
        connectionString: 'encrypted-connection-string',
        aiOptInLevel: 'schema_and_log_and_data',
      })

      if (!tools.execute_sql.execute) throw new Error('execute is undefined')
      const result = await tools.execute_sql.execute(
        {
          sql: 'SELECT email FROM users',
          label: 'Get emails',
          chartConfig: { view: 'table' },
          isWriteQuery: false,
        },
        { toolCallId: 'test', messages: [], context: {} }
      )

      expect(executeSql).toHaveBeenCalledWith(
        {
          projectRef: 'test-project',
          connectionString: 'encrypted-connection-string',
          sql: 'SELECT email FROM users limit 101;',
        },
        undefined,
        undefined
      )
      expect(result).toEqual({ rows, totalRows: 1, optInLevel: 'schema_and_log_and_data' })
      expect((tools.execute_sql as any).toModelOutput({ output: result })).toEqual({
        type: 'json',
        value: rows,
      })
    })

    it('should push a row limit into read queries but leave write queries untouched', async () => {
      vi.mocked(executeSql).mockResolvedValue({ result: [] })
      const tools = getStudioTools({ projectRef: 'test-project', aiOptInLevel: 'schema' })
      if (!tools.execute_sql.execute) throw new Error('execute is undefined')
      const options = { toolCallId: 'test', messages: [], context: {} }
      const base = { label: 'Query', chartConfig: { view: 'table' as const } }

      await tools.execute_sql.execute(
        { ...base, sql: 'SELECT * FROM users', isWriteQuery: false },
        options
      )
      await tools.execute_sql.execute(
        { ...base, sql: 'SELECT cron.schedule(1)', isWriteQuery: true },
        options
      )

      const sqls = vi.mocked(executeSql).mock.calls.map(([vars]) => vars.sql)
      expect(sqls).toEqual(['SELECT * FROM users limit 101;', 'SELECT cron.schedule(1)'])
    })

    it('should cap rows and say the total is unknown when the limit ran in the database', async () => {
      const rows = Array.from({ length: 101 }, (_, i) => ({ id: i }))
      vi.mocked(executeSql).mockResolvedValue({ result: rows })
      const tools = getStudioTools({ aiOptInLevel: 'schema_and_log_and_data' })
      const input = {
        sql: 'SELECT id FROM users',
        label: 'Get ids',
        chartConfig: { view: 'table' as const },
        isWriteQuery: false,
      }

      if (!tools.execute_sql.execute) throw new Error('execute is undefined')
      const result = await tools.execute_sql.execute(input, {
        toolCallId: 'test',
        messages: [],
        context: {},
      })

      const truncatedOutput = {
        rows: rows.slice(0, 100),
        hasMoreRows: true as const,
        optInLevel: 'schema_and_log_and_data' as const,
      }
      expect(result).toEqual(truncatedOutput)
      const modelOutput = await tools.execute_sql.toModelOutput?.({
        toolCallId: 'test',
        input,
        output: truncatedOutput,
      })
      expect(modelOutput).toMatchObject({
        type: 'json',
        value: { rows: rows.slice(0, 100), note: expect.stringContaining('more than 100 rows') },
      })
      expect(JSON.stringify(modelOutput)).toContain('Do not state a specific total')
    })

    it('should report the real total when the query could not be limited in the database', async () => {
      const rows = Array.from({ length: 150 }, (_, i) => ({ id: i }))
      vi.mocked(executeSql).mockResolvedValue({ result: rows })
      const tools = getStudioTools({ aiOptInLevel: 'schema_and_log_and_data' })
      const input = {
        sql: 'SELECT id FROM users; SELECT id FROM users',
        label: 'Get ids',
        chartConfig: { view: 'table' as const },
        isWriteQuery: false,
      }

      if (!tools.execute_sql.execute) throw new Error('execute is undefined')
      const result = await tools.execute_sql.execute(input, {
        toolCallId: 'test',
        messages: [],
        context: {},
      })

      const output = {
        rows: rows.slice(0, 100),
        totalRows: 150,
        optInLevel: 'schema_and_log_and_data' as const,
      }
      expect(result).toEqual(output)
      expect(
        await tools.execute_sql.toModelOutput?.({ toolCallId: 'test', input, output })
      ).toEqual({
        type: 'json',
        value: { rows: rows.slice(0, 100), note: 'Only the first 100 of 150 rows are included.' },
      })
    })
  })
})

describe('ai/tools/studio-tools getOptInTools', () => {
  it('registers update_opt_in_level for the level', () => {
    expect(Object.keys(getOptInTools({ aiOptInLevel: 'schema' }))).toEqual(['update_opt_in_level'])
  })
})
