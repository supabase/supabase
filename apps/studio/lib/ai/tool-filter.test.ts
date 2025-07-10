import { Tool, ToolSet, ToolExecutionOptions } from 'ai'
import { describe, expect, it, vitest } from 'vitest'
import { z } from 'zod'

import {
  TOOL_CATEGORIES,
  TOOL_CATEGORY_MAP,
  filterToolsByOptInLevel,
  createPrivacyMessageTool,
  toolSetValidationSchema,
  transformToolResult,
  checkNetworkExtensionsAndAdjustOptInLevel,
  DatabaseExtension,
} from './tool-filter'

describe('TOOL_CATEGORY_MAP', () => {
  it('should categorize tools correctly', () => {
    expect(TOOL_CATEGORY_MAP['display_query']).toBe(TOOL_CATEGORIES.UI)
    expect(TOOL_CATEGORY_MAP['list_tables']).toBe(TOOL_CATEGORIES.SCHEMA)
    expect(TOOL_CATEGORY_MAP['get_logs']).toBe(TOOL_CATEGORIES.LOG)
    expect(TOOL_CATEGORY_MAP['execute_sql']).toBe(TOOL_CATEGORIES.DATA)
  })
})

describe('tool allowance by opt-in level', () => {
  // Helper function to get allowed tools for a given opt-in level
  function getAllowedTools(optInLevel: string) {
    const mockTools: ToolSet = {
      // UI tools
      display_query: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
      display_edge_function: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
      rename_chat: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
      search_docs: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
      // Schema tools
      list_tables: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
      list_extensions: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
      list_edge_functions: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
      list_branches: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
      // Log tools
      get_logs: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
      get_advisors: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
      get_log_counts: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
      // Data tools
      execute_sql: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
    } as unknown as ToolSet

    const filtered = filterToolsByOptInLevel(mockTools, optInLevel as any)
    const allowedTools: string[] = []

    Object.entries(filtered).forEach(([toolName, tool]) => {
      // Check if tool is actually allowed (not stubbed)
      const isStubbed = tool.description?.includes('Requires opting in')
      if (!isStubbed) {
        allowedTools.push(toolName)
      }
    })

    return allowedTools
  }

  it('should return only UI tools for disabled opt-in level', () => {
    const tools = getAllowedTools('disabled')
    expect(tools).toContain('display_query')
    expect(tools).toContain('display_edge_function')
    expect(tools).toContain('rename_chat')
    expect(tools).toContain('search_docs')
    expect(tools).not.toContain('list_tables')
    expect(tools).not.toContain('list_extensions')
    expect(tools).not.toContain('list_edge_functions')
    expect(tools).not.toContain('list_branches')
    expect(tools).not.toContain('get_logs')
    expect(tools).not.toContain('execute_sql')
  })

  it('should return UI and schema tools for schema opt-in level', () => {
    const tools = getAllowedTools('schema')
    expect(tools).toContain('display_query')
    expect(tools).toContain('display_edge_function')
    expect(tools).toContain('rename_chat')
    expect(tools).toContain('list_tables')
    expect(tools).toContain('list_extensions')
    expect(tools).toContain('list_edge_functions')
    expect(tools).toContain('list_branches')
    expect(tools).toContain('search_docs')
    expect(tools).not.toContain('get_logs')
    expect(tools).not.toContain('get_advisors')
    expect(tools).not.toContain('get_log_counts')
    expect(tools).not.toContain('execute_sql')
  })

  it('should return UI, schema and log tools for schema_and_log opt-in level', () => {
    const tools = getAllowedTools('schema_and_log')
    expect(tools).toContain('display_query')
    expect(tools).toContain('display_edge_function')
    expect(tools).toContain('rename_chat')
    expect(tools).toContain('list_tables')
    expect(tools).toContain('list_extensions')
    expect(tools).toContain('list_edge_functions')
    expect(tools).toContain('list_branches')
    expect(tools).toContain('search_docs')
    expect(tools).toContain('get_logs')
    expect(tools).toContain('get_advisors')
    expect(tools).toContain('get_log_counts')
    expect(tools).not.toContain('execute_sql')
  })

  it('should return all tools for schema_and_log_and_data opt-in level', () => {
    const tools = getAllowedTools('schema_and_log_and_data')
    expect(tools).toContain('display_query')
    expect(tools).toContain('display_edge_function')
    expect(tools).toContain('rename_chat')
    expect(tools).toContain('list_tables')
    expect(tools).toContain('list_extensions')
    expect(tools).toContain('list_edge_functions')
    expect(tools).toContain('list_branches')
    expect(tools).toContain('search_docs')
    expect(tools).toContain('get_logs')
    expect(tools).toContain('get_advisors')
    expect(tools).toContain('get_log_counts')
    expect(tools).toContain('execute_sql')
  })
})

describe('filterToolsByOptInLevel', () => {
  const mockTools: ToolSet = {
    // UI tools - should return non-privacy responses
    display_query: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
    display_edge_function: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
    rename_chat: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
    // Schema tools
    list_tables: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
    list_extensions: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
    list_edge_functions: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
    list_branches: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
    search_docs: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
    // Log tools
    get_logs: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
    get_advisors: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
    get_log_counts: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
    // Data tools
    execute_sql: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
    // Unknown tool - should be filtered out entirely
    some_other_tool: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
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

  it('should filter out unknown tools entirely', async () => {
    const tools = filterToolsByOptInLevel(mockTools, 'disabled')

    // Unknown tools should be completely filtered out (not present in result)
    expect(tools).not.toHaveProperty('some_other_tool')
  })

  it('should always allow UI tools regardless of opt-in level', async () => {
    const tools = filterToolsByOptInLevel(mockTools, 'disabled')

    expect(tools).toHaveProperty('display_query')
    expect(tools).toHaveProperty('display_edge_function')
    expect(tools).toHaveProperty('rename_chat')

    // UI tools should not be stubbed, but managed tools should be
    await expectStubsFor(tools, [
      'list_tables',
      'list_extensions',
      'list_edge_functions',
      'list_branches',
      'get_logs',
      'get_advisors',
      'get_log_counts',
      'execute_sql',
    ])
  })

  it('should stub all managed tools for disabled opt-in level', async () => {
    const tools = filterToolsByOptInLevel(mockTools, 'disabled')

    await expectStubsFor(tools, [
      'list_tables',
      'list_extensions',
      'list_edge_functions',
      'list_branches',
      'get_logs',
      'get_advisors',
      'get_log_counts',
      'execute_sql',
    ])
  })

  it('should stub log and execute tools for schema opt-in level', async () => {
    const tools = filterToolsByOptInLevel(mockTools, 'schema')

    await expectStubsFor(tools, ['get_logs', 'get_advisors', 'get_log_counts', 'execute_sql'])
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

describe('createPrivacyMessageTool', () => {
  it('should create a privacy message tool', async () => {
    const originalTool = {
      description: 'Original description',
      parameters: z.object({}),
      execute: vitest.fn(),
    }

    const privacyTool = createPrivacyMessageTool(originalTool)

    expect(privacyTool.description).toContain('Original description')
    expect(privacyTool.description).toContain('Requires opting in')

    const result = await privacyTool.execute({}, {})
    expect(result.status).toContain("You don't have permission to use this tool")
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

describe('toolSetValidationSchema', () => {
  it('should accept subset of known tools', () => {
    const validSubset = {
      list_tables: { parameters: z.object({}), execute: vitest.fn() },
      get_logs: { parameters: z.object({}), execute: vitest.fn() },
      display_query: { parameters: z.object({}), execute: vitest.fn() },
    }

    const result = toolSetValidationSchema.safeParse(validSubset)
    expect(result.success).toBe(true)
  })

  it('should reject unknown tools', () => {
    const toolsWithUnknown = {
      list_tables: { parameters: z.object({}), execute: vitest.fn() },
      unknown_tool: { parameters: z.object({}), execute: vitest.fn() },
      another_unknown: { parameters: z.object({}), execute: vitest.fn() },
    }

    const result = toolSetValidationSchema.safeParse(toolsWithUnknown)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toHaveLength(2) // Two unknown tools
      expect(result.error.issues[0].message).toContain('Invalid enum value')
    }
  })

  it('should accept empty tool set', () => {
    const result = toolSetValidationSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('should validate all expected tools from the old schema', () => {
    const allExpectedTools = {
      list_tables: { parameters: z.object({}), execute: vitest.fn() },
      list_extensions: { parameters: z.object({}), execute: vitest.fn() },
      list_edge_functions: { parameters: z.object({}), execute: vitest.fn() },
      list_branches: { parameters: z.object({}), execute: vitest.fn() },
      get_logs: { parameters: z.object({}), execute: vitest.fn() },
      execute_sql: { parameters: z.object({}), execute: vitest.fn() },
      search_docs: { parameters: z.object({}), execute: vitest.fn() },
      get_advisors: { parameters: z.object({}), execute: vitest.fn() },
      display_query: { parameters: z.object({}), execute: vitest.fn() },
      display_edge_function: { parameters: z.object({}), execute: vitest.fn() },
      rename_chat: { parameters: z.object({}), execute: vitest.fn() },
      get_log_counts: { parameters: z.object({}), execute: vitest.fn() },
    }

    const validationResult = toolSetValidationSchema.safeParse(allExpectedTools)
    expect(validationResult.success).toBe(true)

    // Test with missing tool
    const incompleteTools = { ...allExpectedTools }
    delete (incompleteTools as any).execute_sql

    const incompleteValidationResult = toolSetValidationSchema.safeParse(incompleteTools)
    expect(incompleteValidationResult.success).toBe(true) // Should still pass as we allow subsets
  })
})

describe('checkNetworkExtensionsAndAdjustOptInLevel', () => {
  const createMockExtension = (name: string, installedVersion?: string): DatabaseExtension => ({
    comment: null,
    default_version: '1.0',
    installed_version: installedVersion || null,
    name,
    schema: 'public',
  })

  it('should return the same opt-in level when no extensions are provided', () => {
    const result = checkNetworkExtensionsAndAdjustOptInLevel(null, 'schema_and_log_and_data')
    expect(result).toBe('schema_and_log_and_data')
  })

  it('should return the same opt-in level when extensions array is empty', () => {
    const result = checkNetworkExtensionsAndAdjustOptInLevel([], 'schema_and_log_and_data')
    expect(result).toBe('schema_and_log_and_data')
  })

  it('should return the same opt-in level when extensions array is undefined', () => {
    const result = checkNetworkExtensionsAndAdjustOptInLevel(undefined, 'schema_and_log_and_data')
    expect(result).toBe('schema_and_log_and_data')
  })

  it('should not downgrade when no dangerous network extensions are installed', () => {
    const extensions = [
      createMockExtension('postgis', '3.2.0'),
      createMockExtension('uuid-ossp', '1.1'),
      createMockExtension('pg_trgm', '1.6'),
    ]

    const result = checkNetworkExtensionsAndAdjustOptInLevel(extensions, 'schema_and_log_and_data')
    expect(result).toBe('schema_and_log_and_data')
  })

  it('should downgrade from schema_and_log_and_data to schema_and_log when pg_net is installed', () => {
    const extensions = [
      createMockExtension('postgis', '3.2.0'),
      createMockExtension('pg_net', '0.7.1'), // installed
      createMockExtension('uuid-ossp', '1.1'),
    ]

    const result = checkNetworkExtensionsAndAdjustOptInLevel(extensions, 'schema_and_log_and_data')
    expect(result).toBe('schema_and_log')
  })

  it('should downgrade from schema_and_log_and_data to schema_and_log when http extension is installed', () => {
    const extensions = [
      createMockExtension('postgis', '3.2.0'),
      createMockExtension('http', '1.5.0'), // installed
      createMockExtension('uuid-ossp', '1.1'),
    ]

    const result = checkNetworkExtensionsAndAdjustOptInLevel(extensions, 'schema_and_log_and_data')
    expect(result).toBe('schema_and_log')
  })

  it('should downgrade when both pg_net and http extensions are installed', () => {
    const extensions = [
      createMockExtension('pg_net', '0.7.1'), // installed
      createMockExtension('http', '1.5.0'), // installed
      createMockExtension('uuid-ossp', '1.1'),
    ]

    const result = checkNetworkExtensionsAndAdjustOptInLevel(extensions, 'schema_and_log_and_data')
    expect(result).toBe('schema_and_log')
  })

  it('should not downgrade when dangerous extensions are available but not installed', () => {
    const extensions = [
      createMockExtension('pg_net'), // not installed (no installed_version)
      createMockExtension('http'), // not installed (no installed_version)
      createMockExtension('postgis', '3.2.0'), // installed
    ]

    const result = checkNetworkExtensionsAndAdjustOptInLevel(extensions, 'schema_and_log_and_data')
    expect(result).toBe('schema_and_log_and_data')
  })

  it('should not downgrade when opt-in level is already at or below schema_and_log', () => {
    const extensions = [
      createMockExtension('pg_net', '0.7.1'), // installed
    ]

    // Test with schema_and_log - should remain unchanged
    const result1 = checkNetworkExtensionsAndAdjustOptInLevel(extensions, 'schema_and_log')
    expect(result1).toBe('schema_and_log')

    // Test with schema - should remain unchanged
    const result2 = checkNetworkExtensionsAndAdjustOptInLevel(extensions, 'schema')
    expect(result2).toBe('schema')

    // Test with disabled - should remain unchanged
    const result3 = checkNetworkExtensionsAndAdjustOptInLevel(extensions, 'disabled')
    expect(result3).toBe('disabled')
  })

  it('should handle extensions with empty string installed_version as not installed', () => {
    const extensions = [
      {
        comment: null,
        default_version: '1.0',
        installed_version: '', // empty string should be treated as not installed
        name: 'pg_net',
        schema: 'public',
      },
    ]

    const result = checkNetworkExtensionsAndAdjustOptInLevel(extensions, 'schema_and_log_and_data')
    expect(result).toBe('schema_and_log_and_data')
  })

  it('should handle extensions with null installed_version as not installed', () => {
    const extensions = [
      {
        comment: null,
        default_version: '1.0',
        installed_version: null, // explicitly null
        name: 'pg_net',
        schema: 'public',
      },
    ]

    const result = checkNetworkExtensionsAndAdjustOptInLevel(extensions, 'schema_and_log_and_data')
    expect(result).toBe('schema_and_log_and_data')
  })
})
