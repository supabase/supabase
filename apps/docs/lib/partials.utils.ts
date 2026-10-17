/**
 * Shared $Partial variable substitution for the MDX runtime pipeline and the
 * markdown export pipeline.
 */

/**
 * Substitutes provided variables into partial content. Variable substitution is
 * optional: any variable referenced in the content but not provided is replaced
 * with an empty string, and any variable provided but not referenced is ignored.
 * A leading `\` escape (`\{{ .var }}`) opts a placeholder out of substitution.
 */
export function substitutePartialVars(
  content: string,
  vars: Record<string, string> | undefined
): string {
  for (const [key, value] of Object.entries(vars ?? {})) {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    content = content.replace(
      new RegExp(`(?<!\\\\)\\{\\{\\s*\\.${escapedKey}\\s*\\}\\}`, 'g'),
      () => value
    )
  }

  content = content.replace(/(?<!\\)\{\{\s*\.[\w-]+\s*\}\}/g, '')
  return content
}

function assertStringValues(parsed: unknown): asserts parsed is Record<string, string> {
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Invalid $Partial variables: must be valid JSON containing only string values')
  }

  for (const value of Object.values(parsed)) {
    if (typeof value !== 'string') {
      throw new Error(
        'Invalid $Partial variables: must be valid JSON containing only string values'
      )
    }
  }
}

/**
 * Parses the `variables` prop from a `$Partial` node. Accepts a JSON object
 * string (from MDX attribute expressions) or an already-parsed object.
 */
export function parsePartialVariables(raw: unknown): Record<string, string> | undefined {
  if (raw === undefined || raw === null || raw === true) {
    return undefined
  }

  if (typeof raw === 'object') {
    assertStringValues(raw)
    return raw
  }

  if (typeof raw !== 'string') {
    throw new Error('Invalid $Partial variables: must be valid JSON containing only string values')
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    assertStringValues(parsed)
    return parsed
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Invalid $Partial variables')) {
      throw error
    }
    throw new Error('Invalid $Partial variables: must be valid JSON containing only string values')
  }
}
