import { safeSql } from '@supabase/pg-meta'
import { components } from 'api-types'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getStudioTools } from './studio-tools'
import type { EdgeFunction } from '@/data/edge-functions/edge-function-query'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import { NO_DATA_PERMISSIONS } from '@/lib/ai/tools/tool-sanitizer'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

type DeployFunctionResponse = components['schemas']['DeployFunctionResponse_Output']

vi.mock('@/data/sql/execute-sql-mutation', () => ({
  executeSql: vi.fn(),
}))

describe('ai/tools/studio-tools', () => {
  beforeEach(() => {
    vi.mocked(executeSql).mockReset()
  })

  describe('getStudioTools', () => {
    it('should return an object with tool definitions', () => {
      const tools = getStudioTools()

      expect(tools).toBeDefined()
      expect(typeof tools).toBe('object')
    })

    it('should include execute_sql tool', () => {
      const tools = getStudioTools()

      expect(tools.execute_sql).toBeDefined()
      expect(tools.execute_sql.description).toContain('execute a SQL statement')
    })

    it('should include deploy_edge_function tool', () => {
      const tools = getStudioTools()

      expect(tools.deploy_edge_function).toBeDefined()
      expect(tools.deploy_edge_function.description).toContain('deploy a Supabase Edge Function')
    })

    it('should include rename_chat tool', () => {
      const tools = getStudioTools()

      expect(tools.rename_chat).toBeDefined()
      expect(tools.rename_chat.description).toContain('Rename the current chat session')
    })

    it('should have exactly 4 tools', () => {
      const tools = getStudioTools()
      const toolNames = Object.keys(tools)

      expect(toolNames).toHaveLength(4)
      expect(toolNames).toContain('load_knowledge')
      expect(toolNames).toContain('execute_sql')
      expect(toolNames).toContain('deploy_edge_function')
      expect(toolNames).toContain('rename_chat')
    })

    it('should include logs in the load_knowledge schema', () => {
      const tools = getStudioTools()
      const schema = tools.load_knowledge.inputSchema

      if ('safeParse' in schema) {
        expect(schema.safeParse({ name: 'logs' }).success).toBe(true)
        expect(schema.safeParse({ name: 'pg_best_practices' }).success).toBe(true)
        expect(schema.safeParse({ name: 'not_a_topic' }).success).toBe(false)
      } else {
        expect(schema).toBeDefined()
      }
    })

    it('should return ClickHouse logs knowledge for load_knowledge logs', async () => {
      const tools = getStudioTools()
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

    it('should have execute_sql with correct input schema fields', () => {
      const tools = getStudioTools()
      const executeSqlTool = tools.execute_sql

      // Check that the tool has an input schema
      expect(executeSqlTool.inputSchema).toBeDefined()

      // Verify the schema exists and is a Zod object
      const schema = executeSqlTool.inputSchema
      expect(schema).toBeDefined()
      expect((schema as any)._def.typeName).toBe('ZodObject')
    })

    it('should have deploy_edge_function with input schema', () => {
      const tools = getStudioTools()
      const deployTool = tools.deploy_edge_function

      expect(deployTool.inputSchema).toBeDefined()

      // Verify the schema exists and is a Zod object
      expect(deployTool.inputSchema).toBeDefined()
      expect((deployTool.inputSchema as any)._def.typeName).toBe('ZodObject')
    })

    it('should have rename_chat with execute function', async () => {
      const tools = getStudioTools()
      const renameTool = tools.rename_chat

      expect(renameTool.execute).toBeDefined()
      expect(typeof renameTool.execute).toBe('function')

      // Test the execute function
      if (!renameTool.execute) throw new Error('execute is undefined')
      const result = await renameTool.execute(
        { newName: 'Test Chat' },
        { toolCallId: 'test', messages: [], context: {} }
      )
      expect(result).toEqual({ status: 'Chat request sent to client' })
    })

    it('should validate execute_sql input schema correctly', () => {
      const tools = getStudioTools()
      const schema = tools.execute_sql.inputSchema

      // Check if schema is a Zod schema with safeParse
      if ('safeParse' in schema) {
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
      } else {
        // Skip test if schema doesn't have safeParse
        expect(schema).toBeDefined()
      }
    })

    it('should require approval for read and write SQL queries', () => {
      const tools = getStudioTools()

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
          sql: 'SELECT email FROM users',
        },
        undefined,
        undefined
      )
      expect(result).toEqual(rows)
      expect((tools.execute_sql as any).toModelOutput({ output: result })).toEqual({
        type: 'text',
        value: NO_DATA_PERMISSIONS,
      })
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
          sql: 'SELECT email FROM users',
        },
        undefined,
        undefined
      )
      expect(result).toEqual(rows)
      expect((tools.execute_sql as any).toModelOutput({ output: result })).toEqual({
        type: 'json',
        value: rows,
      })
    })

    describe('deploy_edge_function execute', () => {
      const existingFunction: EdgeFunction = {
        id: 'func-id',
        slug: 'my-function',
        name: 'My Function',
        status: 'ACTIVE',
        version: 3,
        created_at: 1700000000000,
        updated_at: 1700000000000,
        verify_jwt: false,
        entrypoint_path: 'index.ts',
      }

      const mockDeploy = () => {
        const deployedMetadata: Record<string, unknown>[] = []
        addAPIMock({
          method: 'post',
          path: '/v1/projects/:ref/functions/deploy',
          response: async ({ request }) => {
            const formData = await request.formData()
            deployedMetadata.push(JSON.parse(String(formData.get('metadata'))))
            return HttpResponse.json<DeployFunctionResponse>({
              id: 'func-id',
              slug: 'my-function',
              name: 'My Function',
              status: 'ACTIVE',
              version: 4,
            })
          },
        })
        return deployedMetadata
      }

      const executeDeploy = async () => {
        const tools = getStudioTools({ projectRef: 'test-project', authorization: 'Bearer token' })
        if (!tools.deploy_edge_function.execute) throw new Error('execute is undefined')
        return await tools.deploy_edge_function.execute(
          { name: 'my-function', code: 'Deno.serve(() => new Response("ok"))' },
          { toolCallId: 'test', messages: [], context: {} }
        )
      }

      it('should preserve verify_jwt and name when redeploying an existing function', async () => {
        addAPIMock({
          method: 'get',
          path: '/v1/projects/:ref/functions/:function_slug',
          response: existingFunction,
        })
        const deployedMetadata = mockDeploy()

        const result = await executeDeploy()

        expect(result).toEqual({ success: true })
        expect(deployedMetadata).toHaveLength(1)
        expect(deployedMetadata[0]).toMatchObject({
          name: 'My Function',
          verify_jwt: false,
          entrypoint_path: 'index.ts',
        })
      })

      it('should default verify_jwt to true for a new function', async () => {
        addAPIMock({
          method: 'get',
          path: '/v1/projects/:ref/functions/:function_slug',
          response: () =>
            HttpResponse.json<APIErrorBody>({ message: 'Function not found' }, { status: 404 }),
        })
        const deployedMetadata = mockDeploy()

        const result = await executeDeploy()

        expect(result).toEqual({ success: true })
        expect(deployedMetadata).toHaveLength(1)
        expect(deployedMetadata[0]).toMatchObject({
          name: 'my-function',
          verify_jwt: true,
        })
      })

      it('should not deploy when the existing function lookup fails', async () => {
        addAPIMock({
          method: 'get',
          path: '/v1/projects/:ref/functions/:function_slug',
          response: () =>
            HttpResponse.json<APIErrorBody>({ message: 'Internal error' }, { status: 500 }),
        })
        const deployedMetadata = mockDeploy()

        await expect(executeDeploy()).rejects.toThrow('Internal error')
        expect(deployedMetadata).toHaveLength(0)
      })
    })

    it('should validate rename_chat input schema correctly', () => {
      const tools = getStudioTools()
      const schema = tools.rename_chat.inputSchema

      // Check if schema is a Zod schema with safeParse
      if ('safeParse' in schema) {
        // Valid input
        expect(schema.safeParse({ newName: 'My Chat' }).success).toBe(true)

        // Invalid input - missing newName
        expect(schema.safeParse({}).success).toBe(false)

        // Invalid input - wrong type
        expect(schema.safeParse({ newName: 123 }).success).toBe(false)
      } else {
        // Skip test if schema doesn't have safeParse
        expect(schema).toBeDefined()
      }
    })
  })
})
