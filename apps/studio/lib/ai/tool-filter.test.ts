import { Tool, ToolSet } from 'ai'
import { describe, expect, it, vitest } from 'vitest'
import { z } from 'zod'

import {
  TOOL_CATEGORIES,
  TOOL_CATEGORY_MAP,
  filterToolsByOptInLevel,
  createPrivacyMessageTool,
  toolSetValidationSchema,
} from './tool-filter'

describe('TOOL_CATEGORY_MAP', () => {
  it('should categorize tools correctly', () => {
    expect(TOOL_CATEGORY_MAP['execute_sql']).toBe(TOOL_CATEGORIES.UI)
    expect(TOOL_CATEGORY_MAP['list_tables']).toBe(TOOL_CATEGORIES.SCHEMA)
  })
})

describe('tool allowance by opt-in level', () => {
  // Helper function to get allowed tools for a given opt-in level
  function getAllowedTools(optInLevel: string) {
    const mockTools: ToolSet = {
      // UI tools
      execute_sql: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
      deploy_edge_function: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
      rename_chat: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
      search_docs: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
      // Schema tools
      list_tables: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
      list_extensions: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
      list_edge_functions: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
      list_branches: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
      list_policies: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
      // Log tools
      get_advisors: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
      get_logs: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
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
    expect(tools).toContain('execute_sql')
    expect(tools).toContain('deploy_edge_function')
    expect(tools).toContain('rename_chat')
    expect(tools).toContain('search_docs')
    expect(tools).not.toContain('list_tables')
    expect(tools).not.toContain('list_extensions')
    expect(tools).not.toContain('list_edge_functions')
    expect(tools).not.toContain('list_branches')
    expect(tools).not.toContain('get_logs')
    expect(tools).not.toContain('get_advisors')
  })

  it('should return UI and schema tools for schema opt-in level', () => {
    const tools = getAllowedTools('schema')
    expect(tools).toContain('execute_sql')
    expect(tools).toContain('deploy_edge_function')
    expect(tools).toContain('rename_chat')
    expect(tools).toContain('list_tables')
    expect(tools).toContain('list_extensions')
    expect(tools).toContain('list_edge_functions')
    expect(tools).toContain('list_branches')
    expect(tools).toContain('list_policies')
    expect(tools).toContain('search_docs')
    expect(tools).not.toContain('get_advisors')
    expect(tools).not.toContain('get_logs')
  })

  it('should return UI, schema and log tools for schema_and_log opt-in level', () => {
    const tools = getAllowedTools('schema_and_log')
    expect(tools).toContain('execute_sql')
    expect(tools).toContain('deploy_edge_function')
    expect(tools).toContain('rename_chat')
    expect(tools).toContain('list_tables')
    expect(tools).toContain('list_extensions')
    expect(tools).toContain('list_edge_functions')
    expect(tools).toContain('list_branches')
    expect(tools).toContain('list_policies')
    expect(tools).toContain('search_docs')
    expect(tools).toContain('get_advisors')
    expect(tools).toContain('get_logs')
  })

  it('should return all tools for schema_and_log_and_data opt-in level', () => {
    const tools = getAllowedTools('schema_and_log_and_data')
    expect(tools).toContain('execute_sql')
    expect(tools).toContain('deploy_edge_function')
    expect(tools).toContain('rename_chat')
    expect(tools).toContain('list_tables')
    expect(tools).toContain('list_extensions')
    expect(tools).toContain('list_edge_functions')
    expect(tools).toContain('list_branches')
    expect(tools).toContain('list_policies')
    expect(tools).toContain('search_docs')
    expect(tools).toContain('get_advisors')
    expect(tools).toContain('get_logs')
  })
})

describe('filterToolsByOptInLevel', () => {
  const mockTools: ToolSet = {
    // UI tools - should return non-privacy responses
    execute_sql: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
    deploy_edge_function: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
    rename_chat: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
    // Schema tools
    list_tables: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
    list_extensions: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
    list_edge_functions: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
    list_branches: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
    list_policies: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
    search_docs: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
    // Log tools
    get_advisors: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
    get_logs: { execute: vitest.fn().mockResolvedValue({ status: 'success' }) },
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

    expect(tools).toHaveProperty('execute_sql')
    expect(tools).toHaveProperty('deploy_edge_function')
    expect(tools).toHaveProperty('rename_chat')

    // UI tools should not be stubbed, but managed tools should be
    await expectStubsFor(tools, [
      'list_tables',
      'list_extensions',
      'list_edge_functions',
      'list_branches',
      'list_policies',
      'get_advisors',
      'get_logs',
    ])
  })

  it('should stub all managed tools for disabled opt-in level', async () => {
    const tools = filterToolsByOptInLevel(mockTools, 'disabled')

    await expectStubsFor(tools, [
      'list_tables',
      'list_extensions',
      'list_edge_functions',
      'list_branches',
      'list_policies',
      'get_advisors',
      'get_logs',
    ])
  })

  it('should stub log tools for schema opt-in level', async () => {
    const tools = filterToolsByOptInLevel(mockTools, 'schema')

    await expectStubsFor(tools, ['get_advisors', 'get_logs'])
  })

  // No execute_sql tool, so nothing additional to stub for schema_and_log opt-in level

  it('should not stub any tools for schema_and_log_and_data opt-in level', async () => {
    const tools = filterToolsByOptInLevel(mockTools, 'schema_and_log_and_data')

    await expectStubsFor(tools, [])
  })
})

describe('createPrivacyMessageTool', () => {
  it('should create a privacy message tool', async () => {
    const originalTool = {
      description: 'Original description',
      inputSchema: z.object({}),
      execute: vitest.fn(),
    }

    const privacyTool = createPrivacyMessageTool(originalTool)

    expect(privacyTool.description).toContain('Original description')
    expect(privacyTool.description).toContain('Requires opting in')

    const result = await privacyTool.execute({}, {})
    expect(result.status).toContain("You don't have permission to use this tool")
  })
})

describe('toolSetValidationSchema', () => {
  it('should accept subset of known tools', () => {
    const validSubset = {
      list_tables: { inputSchema: z.object({}), execute: vitest.fn() },
      execute_sql: { inputSchema: z.object({}), execute: vitest.fn() },
    }

    const result = toolSetValidationSchema.safeParse(validSubset)
    expect(result.success).toBe(true)
  })

  it('should reject unknown tools', () => {
    const toolsWithUnknown = {
      list_tables: { inputSchema: z.object({}), execute: vitest.fn() },
      unknown_tool: { inputSchema: z.object({}), execute: vitest.fn() },
      another_unknown: { inputSchema: z.object({}), execute: vitest.fn() },
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
      list_tables: { inputSchema: z.object({}), execute: vitest.fn() },
      list_extensions: { inputSchema: z.object({}), execute: vitest.fn() },
      list_edge_functions: { inputSchema: z.object({}), execute: vitest.fn() },
      list_branches: { inputSchema: z.object({}), execute: vitest.fn() },
      list_policies: { inputSchema: z.object({}), execute: vitest.fn() },
      search_docs: { inputSchema: z.object({}), execute: vitest.fn() },
      get_advisors: { inputSchema: z.object({}), execute: vitest.fn() },
      execute_sql: { inputSchema: z.object({}), execute: vitest.fn() },
      deploy_edge_function: { inputSchema: z.object({}), execute: vitest.fn() },
      rename_chat: { inputSchema: z.object({}), execute: vitest.fn() },
      get_logs: { inputSchema: z.object({}), execute: vitest.fn() },
    }

    const validationResult = toolSetValidationSchema.safeParse(allExpectedTools)
    expect(validationResult.success).toBe(true)

    // Test with missing tool
    const incompleteTools = { ...allExpectedTools }
    delete (incompleteTools as any).search_docs

    const incompleteValidationResult = toolSetValidationSchema.safeParse(incompleteTools)
    expect(incompleteValidationResult.success).toBe(true) // Should still pass as we allow subsets
  })
})
