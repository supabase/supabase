import { describe, expect, it } from 'vitest'

import { getRenderingTools } from './rendering-tools'

describe('ai/tools/rendering-tools', () => {
  describe('getRenderingTools', () => {
    it('should return an object with tool definitions', () => {
      const tools = getRenderingTools()

      expect(tools).toBeDefined()
      expect(typeof tools).toBe('object')
    })

    it('should include execute_sql tool', () => {
      const tools = getRenderingTools()

      expect(tools.execute_sql).toBeDefined()
      expect(tools.execute_sql.description).toContain('execute a SQL statement')
    })

    it('should include deploy_edge_function tool', () => {
      const tools = getRenderingTools()

      expect(tools.deploy_edge_function).toBeDefined()
      expect(tools.deploy_edge_function.description).toContain('deploy a Supabase Edge Function')
    })

    it('should include rename_chat tool', () => {
      const tools = getRenderingTools()

      expect(tools.rename_chat).toBeDefined()
      expect(tools.rename_chat.description).toContain('Rename the current chat session')
    })

    it('should have exactly 3 tools', () => {
      const tools = getRenderingTools()
      const toolNames = Object.keys(tools)

      expect(toolNames).toHaveLength(3)
      expect(toolNames).toContain('execute_sql')
      expect(toolNames).toContain('deploy_edge_function')
      expect(toolNames).toContain('rename_chat')
    })

    it('should have execute_sql with correct input schema fields', () => {
      const tools = getRenderingTools()
      const executeSqlTool = tools.execute_sql

      // Check that the tool has an input schema
      expect(executeSqlTool.inputSchema).toBeDefined()

      // Parse the schema to verify structure
      const schema = executeSqlTool.inputSchema
      const parsedEmpty = schema.safeParse({})

      // Should require certain fields
      expect(parsedEmpty.success).toBe(false)
    })

    it('should have deploy_edge_function with input schema', () => {
      const tools = getRenderingTools()
      const deployTool = tools.deploy_edge_function

      expect(deployTool.inputSchema).toBeDefined()

      // Test valid input
      const validInput = {
        name: 'my-function',
        code: 'export default () => new Response("Hello")',
      }
      const result = deployTool.inputSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    it('should have rename_chat with execute function', async () => {
      const tools = getRenderingTools()
      const renameTool = tools.rename_chat

      expect(renameTool.execute).toBeDefined()
      expect(typeof renameTool.execute).toBe('function')

      // Test the execute function
      const result = await renameTool.execute({ newName: 'Test Chat' })
      expect(result).toEqual({ status: 'Chat request sent to client' })
    })

    it('should validate execute_sql input schema correctly', () => {
      const tools = getRenderingTools()
      const schema = tools.execute_sql.inputSchema

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
    })

    it('should validate rename_chat input schema correctly', () => {
      const tools = getRenderingTools()
      const schema = tools.rename_chat.inputSchema

      // Valid input
      expect(schema.safeParse({ newName: 'My Chat' }).success).toBe(true)

      // Invalid input - missing newName
      expect(schema.safeParse({}).success).toBe(false)

      // Invalid input - wrong type
      expect(schema.safeParse({ newName: 123 }).success).toBe(false)
    })
  })
})
