import type { CallToolResult } from 'npm:@modelcontextprotocol/sdk@1.29.0/types'

// Shared helpers for building MCP tool results, so every tool returns the same
// shape and signals failure the same way.

/**
 * A successful result. `value` is JSON-serialised into one text block, which is
 * the format MCP clients and models parse most reliably.
 */
export function jsonResult(value: unknown): CallToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(value) }],
  }
}

/**
 * A failed result. The message goes back to the model so it can correct itself,
 * so keep it actionable — and free of credentials, claims, and stack traces.
 */
export function errorResult(message: string): CallToolResult {
  return {
    isError: true,
    content: [{ type: 'text', text: message }],
  }
}

function readString(value: unknown, key: string): string | null {
  if (!value || typeof value !== 'object' || !(key in value)) return null
  const property = (value as Record<string, unknown>)[key]
  return typeof property === 'string' && property ? property : null
}

/**
 * Turn an unknown thrown value into a safe MCP error. Supabase API errors often
 * carry a `code` and `hint`, both of which help a model fix its next call.
 */
export function runtimeErrorResult(error: unknown): CallToolResult {
  const message = error instanceof Error ? error.message : String(error)
  const code = readString(error, 'code')
  const hint = readString(error, 'hint')

  return errorResult(
    [code ? `[${code}]` : null, message, hint ? `Hint: ${hint}` : null].filter(Boolean).join(' ')
  )
}
