import { describe, expect, it } from 'vitest'

import { annotateMcpToolError, isPermissionDeniedText } from './mcp-tools.utils'

const context = { projectRef: 'bxhxzkkfnqxpwrlqaokd', mcpUrl: 'https://mcp.supabase.com/mcp' }

describe('isPermissionDeniedText', () => {
  it('matches the MCP server permission and access-denied messages', () => {
    expect(
      isPermissionDeniedText(
        '{"error":{"name":"ProtocolError","message":"MCP error -32600: You do not have permission to perform this action"}}'
      )
    ).toBe(true)
    expect(
      isPermissionDeniedText(
        "Failed to execute SQL query. Access to project 'abc' was denied. If this project exists, your access token may be scoped to a different organization"
      )
    ).toBe(true)
  })

  it('ignores unrelated errors', () => {
    expect(isPermissionDeniedText('relation "foo" does not exist')).toBe(false)
  })
})

describe('annotateMcpToolError', () => {
  it('appends a platform hint to permission-denied error results', () => {
    const result = annotateMcpToolError(
      {
        isError: true,
        content: [{ type: 'text', text: 'You do not have permission to perform this action' }],
      },
      context
    )

    expect(result.content).toHaveLength(2)
    const hint = (result.content as { text: string }[])[1].text
    expect(hint).toContain("project 'bxhxzkkfnqxpwrlqaokd' on mcp.supabase.com")
    expect(hint).toContain('MANAGEMENT_API_URL / MCP_URL')
  })

  it('leaves successful results and other errors untouched', () => {
    const ok = { isError: false, content: [{ type: 'text', text: '[]' }] }
    expect(annotateMcpToolError(ok, context)).toBe(ok)

    const other = { isError: true, content: [{ type: 'text', text: 'syntax error at or near' }] }
    expect(annotateMcpToolError(other, context)).toBe(other)
  })
})
