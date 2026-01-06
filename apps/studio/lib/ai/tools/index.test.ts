import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getTools } from './index'
import { getRenderingTools } from './rendering-tools'
import { getFallbackTools } from './fallback-tools'
import { getMcpTools } from './mcp-tools'
import { getSchemaTools } from './schema-tools'
import { filterToolsByOptInLevel } from '../tool-filter'

vi.mock('./rendering-tools', () => ({
  getRenderingTools: vi.fn(),
}))

vi.mock('./fallback-tools', () => ({
  getFallbackTools: vi.fn(),
}))

vi.mock('./mcp-tools', () => ({
  getMcpTools: vi.fn(),
}))

vi.mock('./schema-tools', () => ({
  getSchemaTools: vi.fn(),
}))

vi.mock('../tool-filter', () => ({
  filterToolsByOptInLevel: vi.fn((tools) => tools),
}))

vi.mock('common', () => ({
  IS_PLATFORM: true,
}))

describe('getTools', () => {
  const projectRef = 'test-project-ref'
  const connectionString = 'postgresql://localhost/test'
  const authorization = 'Bearer token'
  const accessToken = 'access-token'

  const mockRenderingTools = { render_sql: { execute: vi.fn() } }
  const mockFallbackTools = { get_schema_tables: { execute: vi.fn() } }
  const mockMcpTools = { mcp_tool: { execute: vi.fn() } }
  const mockSchemaTools = { schema_tool: { execute: vi.fn() } }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(getRenderingTools as any).mockReturnValue(mockRenderingTools)
    ;(getFallbackTools as any).mockReturnValue(mockFallbackTools)
    ;(getMcpTools as any).mockResolvedValue(mockMcpTools)
    ;(getSchemaTools as any).mockReturnValue(mockSchemaTools)
  })

  it('should always include rendering tools', async () => {
    const result = await getTools({
      projectRef,
      connectionString,
      authorization,
      aiOptInLevel: 'enabled',
      accessToken,
    })

    expect(getRenderingTools).toHaveBeenCalled()
    expect(result).toHaveProperty('render_sql')
  })

  it('should filter tools by opt-in level', async () => {
    const allTools = {
      ...mockRenderingTools,
      ...mockFallbackTools,
    }
    ;(filterToolsByOptInLevel as any).mockReturnValue(allTools)

    const result = await getTools({
      projectRef,
      connectionString,
      authorization,
      aiOptInLevel: 'limited',
    })

    expect(filterToolsByOptInLevel).toHaveBeenCalled()
    expect(result).toBe(allTools)
  })

  it('should call getMcpTools and getSchemaTools when on platform', async () => {
    await getTools({
      projectRef,
      connectionString,
      authorization,
      aiOptInLevel: 'enabled',
      accessToken,
    })

    // On platform with accessToken, should call these tools
    expect(getMcpTools).toHaveBeenCalled()
    expect(getSchemaTools).toHaveBeenCalled()
    // Should NOT call fallback tools on platform
    expect(getFallbackTools).not.toHaveBeenCalled()
  })

  it('should call getMcpTools when accessToken is provided', async () => {
    await getTools({
      projectRef,
      connectionString,
      authorization,
      aiOptInLevel: 'enabled',
      accessToken,
    })

    expect(getMcpTools).toHaveBeenCalledWith({
      accessToken,
      projectRef,
      aiOptInLevel: 'enabled',
    })
  })

  it('should call getSchemaTools when accessToken is provided', async () => {
    await getTools({
      projectRef,
      connectionString,
      authorization,
      aiOptInLevel: 'enabled',
      accessToken,
    })

    expect(getSchemaTools).toHaveBeenCalledWith({
      projectRef,
      connectionString,
      authorization,
    })
  })
})
