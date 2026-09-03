/**
 * Shape of an MCP `tools/call` result as returned by `@ai-sdk/mcp` when the
 * server flags it with `isError`. Only the fields we read are typed.
 */
export type McpToolResult = {
  isError?: boolean
  content?: unknown
}

const PERMISSION_PATTERN = /permission|forbidden|not authori[sz]ed|access .* denied|\b403\b/i

export function isPermissionDeniedText(text: string): boolean {
  return PERMISSION_PATTERN.test(text)
}

/**
 * A permission error from the MCP server almost always means the OAuth token
 * and the project live on different platforms (e.g. Studio against the local
 * platform, assistant against `mcp.supabase.com`) or the user consented for an
 * organization that does not own the project. The server's own message does not
 * say which, so spell it out for the model and the user.
 */
export function platformMismatchHint({
  projectRef,
  mcpUrl,
}: {
  projectRef: string
  mcpUrl: string
}): string {
  const host = new URL(mcpUrl).host
  return (
    `The connected organization's token cannot access project '${projectRef}' on ${host}. ` +
    `Either the organization the user consented to does not own this project, or the ` +
    `assistant's MANAGEMENT_API_URL / MCP_URL point at a different platform than the Studio ` +
    `that opened this project. Ask the user to reconnect the organization that owns this project.`
  )
}

/**
 * Appends the platform-mismatch hint to a permission-denied MCP error result.
 * Leaves every other result untouched.
 */
export function annotateMcpToolError<T extends McpToolResult>(
  result: T,
  context: { projectRef: string; mcpUrl: string }
): T {
  if (!result.isError || !Array.isArray(result.content)) return result

  const texts = result.content.filter(
    (part): part is { type: 'text'; text: string } =>
      !!part &&
      typeof part === 'object' &&
      (part as { type?: unknown }).type === 'text' &&
      typeof (part as { text?: unknown }).text === 'string'
  )
  if (!texts.some((part) => isPermissionDeniedText(part.text))) return result

  return {
    ...result,
    content: [...result.content, { type: 'text', text: platformMismatchHint(context) }],
  }
}
