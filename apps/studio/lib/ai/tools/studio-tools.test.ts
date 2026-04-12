import { describe, expect, it } from 'vitest'

import { getStudioTools } from './studio-tools'

describe('ai/tools/studio-tools', () => {
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
        { toolCallId: 'test', messages: [] }
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
          sql: 'SELECT * FROM users',
          label: 'Get users',
          chartConfig: { view: 'table' as const },
          isWriteQuery: false,
        }
        expect(schema.safeParse(validInput).success).toBe(true)

        // Valid chart config
        const validChartInput = {
          sql: 'SELECT count(*) FROM users',
          label: 'User count',
          chartConfig: { view: 'chart' as const, xAxis: 'date', yAxis: 'count' },
          isWriteQuery: false,
        }
        expect(schema.safeParse(validChartInput).success).toBe(true)

        // Missing required field
        const invalidInput = {
          sql: 'SELECT * FROM users',
          // missing label, chartConfig, isWriteQuery
        }
        expect(schema.safeParse(invalidInput).success).toBe(false)
      } else {
        // Skip test if schema doesn't have safeParse
        expect(schema).toBeDefined()
      }
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
