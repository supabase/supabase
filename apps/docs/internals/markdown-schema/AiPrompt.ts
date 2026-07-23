/**
 * Parses `prompt={"..."}` expression source from propsFrom().
 * Attribute expressions are stored as the raw JS source (e.g. `"line\\nline"`).
 */
function promptFromProps(props: Record<string, unknown>): string {
  const raw = props.prompt
  if (raw == null) return ''
  if (typeof raw !== 'string') return String(raw)

  try {
    const parsed = JSON.parse(raw)
    return typeof parsed === 'string' ? parsed : String(parsed)
  } catch {
    return raw
  }
}

/**
 * Serializes `<AiPrompt prompt={...} />` for markdown export.
 * Reads the `prompt` prop so the body survives the guides pipeline
 * (expression children are skipped).
 */
export const AiPrompt = ({
  props,
  children,
}: {
  props: Record<string, unknown>
  children: string
}): string => {
  const body = (promptFromProps(props) || children).trim()
  return body ? `**AI Prompt**\n\n${body}` : '**AI Prompt**'
}
