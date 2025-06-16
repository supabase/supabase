import { Tool, ToolExecutionOptions, ToolSet } from 'ai'
import { describe, expect, it, vitest } from 'vitest'
import { z } from 'zod'

import {
  expectedToolsSchema,
  filterToolsByOptInLevel,
  getAllowedTools,
  transformToolResult,
} from './supabase-mcp'

describe('getAllowedTools', () => {
  it('should return empty array for disabled opt-in level', () => {
    const tools = getAllowedTools('disabled')
    expect(tools).toEqual([])
  })

  it('should return schema tools for schema opt-in level', () => {
    const tools = getAllowedTools('schema')
    expect(tools).toContain('list_tables')
    expect(tools).toContain('list_extensions')
    expect(tools).toContain('list_edge_functions')
    expect(tools).toContain('list_branches')
    expect(tools).not.toContain('get_logs')
    expect(tools).not.toContain('execute_sql')
  })

  it('should return schema and log tools for schema_and_log opt-in level', () => {
    const tools = getAllowedTools('schema_and_log')
    expect(tools).toContain('list_tables')
    expect(tools).toContain('list_extensions')
    expect(tools).toContain('list_edge_functions')
    expect(tools).toContain('list_branches')
    expect(tools).toContain('get_logs')
    expect(tools).not.toContain('execute_sql')
  })

  it('should return all tools for schema_and_log_and_data opt-in level', () => {
    const tools = getAllowedTools('schema_and_log_and_data')
    expect(tools).toContain('list_tables')
    expect(tools).toContain('list_extensions')
    expect(tools).toContain('list_edge_functions')
    expect(tools).toContain('list_branches')
    expect(tools).toContain('get_logs')
    expect(tools).toContain('execute_sql')
  })
})

describe('filterToolsByOptInLevel', () => {
  const mockTools: ToolSet = {
    list_tables: { execute: vitest.fn() },
    list_extensions: { execute: vitest.fn() },
    list_edge_functions: { execute: vitest.fn() },
    list_branches: { execute: vitest.fn() },
    get_logs: { execute: vitest.fn() },
    execute_sql: { execute: vitest.fn() },
    other: { execute: vitest.fn() }, // This tool should be filtered out
  } as unknown as ToolSet

  const stubResultSchema = z.object({
    status: z.string(),
  })

  async function checkStub(name: string, tool: Tool<any, any>) {
    if (!tool.execute) {
      throw new Error(`Tool ${name} does not have an execute function`)
    }

    const result: { status: string } = await (tool.execute as any)()
    const parsedResult = stubResultSchema.safeParse(result)

    return (
      parsedResult.success &&
      parsedResult.data.status.includes("You don't have permission to use this tool")
    )
  }

  async function expectStubsFor(tools: ToolSet, expectedStubTools: string[]) {
    for (const toolName in tools) {
      const tool = tools[toolName]

      const shouldBeStub = expectedStubTools.includes(toolName)
      const hasStub = await checkStub(toolName, tool)

      expect(hasStub).toBe(shouldBeStub)
    }
  }

  it('should filter out tools not in tool whitelist', async () => {
    const tools = filterToolsByOptInLevel(mockTools, 'disabled')

    expect(tools).not.toHaveProperty('other')
  })

  it('should stub all functions for disabled opt-in level', async () => {
    const tools = filterToolsByOptInLevel(mockTools, 'disabled')

    await expectStubsFor(tools, [
      'list_tables',
      'list_extensions',
      'list_edge_functions',
      'list_branches',
      'get_logs',
      'execute_sql',
    ])
  })

  it('should stub log and execute tools for schema opt-in level', async () => {
    const tools = filterToolsByOptInLevel(mockTools, 'schema')

    await expectStubsFor(tools, ['get_logs', 'execute_sql'])
  })

  it('should stub execute tool for schema_and_log opt-in level', async () => {
    const tools = filterToolsByOptInLevel(mockTools, 'schema_and_log')

    await expectStubsFor(tools, ['execute_sql'])
  })

  it('should not stub any tools for schema_and_log_and_data opt-in level', async () => {
    const tools = filterToolsByOptInLevel(mockTools, 'schema_and_log_and_data')

    await expectStubsFor(tools, [])
  })
})

describe('transformToolResult', () => {
  it('should wrap a tool with a result transformation function', async () => {
    const originalResult = { data: 'original' }

    const mockTool = {
      description: 'Test tool',
      execute: vitest.fn().mockResolvedValue(originalResult),
    } as unknown as Tool<any, typeof originalResult>

    const transformFn = vitest.fn((result: typeof originalResult) => ({
      data: `${result.data} - transformed`,
    }))

    const transformedTool = transformToolResult(mockTool, transformFn)

    // Tool properties should be preserved
    expect(transformedTool.description).toBe(mockTool.description)

    // Execute the transformed tool
    const args = { key: 'value' }
    const options = {} as ToolExecutionOptions

    if (!transformedTool.execute) {
      throw new Error('Transformed tool does not have an execute function')
    }

    const result = await transformedTool.execute(args, options)

    // Original tool should have been called with the same arguments
    expect(mockTool.execute).toHaveBeenCalledWith(args, options)

    // Transform function should have been called with the original result
    expect(transformFn).toHaveBeenCalledWith(originalResult)

    // Final result should be the transformed value
    expect(result).toEqual({ data: 'original - transformed' })
  })

  it('should throw an error if tool is null', () => {
    expect(() => transformToolResult(null as any, () => ({}))).toThrow('Tool is required')
  })

  it('should throw an error if tool does not have an execute function', () => {
    const invalidTool = { name: 'invalid' } as any
    expect(() => transformToolResult(invalidTool, () => ({}))).toThrow(
      'Tool does not have an execute function'
    )
  })
})

describe('expectedToolsSchema', () => {
  it('should validate the expected tools schema', () => {
    const validTools = {
      list_tables: {},
      list_extensions: {},
      list_edge_functions: {},
      list_branches: {},
      get_logs: {},
      execute_sql: {},
      other: {},
    }

    const validationResult = expectedToolsSchema.safeParse(validTools)
    expect(validationResult.success).toBe(true)

    // Test with missing tool
    const invalidTools = { ...validTools }
    delete (invalidTools as any).execute_sql

    const invalidValidationResult = expectedToolsSchema.safeParse(invalidTools)
    expect(invalidValidationResult.success).toBe(false)
  })
})
