/**
 * Decodes a JS string literal from MDX attribute expression source.
 * `propsFrom()` stores the raw expression (e.g. `"line\\nline"` or
 * Prettier's multiline `'\n  ...'`); expression children are skipped by
 * the guides pipeline, so the prompt must be read from this prop.
 */
function decodeJsStringLiteralSource(source: string): string {
  const trimmed = source.trim()
  if (trimmed.length < 2) return trimmed

  const quote = trimmed[0]
  if ((quote !== '"' && quote !== "'") || trimmed.at(-1) !== quote) {
    return trimmed
  }

  if (quote === '"') {
    try {
      const parsed = JSON.parse(trimmed)
      return typeof parsed === 'string' ? parsed : trimmed
    } catch {
      // Fall through to manual decode for non-JSON edge cases.
    }
  }

  let result = ''
  for (let i = 1; i < trimmed.length - 1; i++) {
    const char = trimmed[i]
    if (char !== '\\') {
      result += char
      continue
    }
    const next = trimmed[++i]
    if (next === undefined) {
      result += '\\'
      break
    }
    switch (next) {
      case 'n':
        result += '\n'
        break
      case 'r':
        result += '\r'
        break
      case 't':
        result += '\t'
        break
      case '\\':
        result += '\\'
        break
      case "'":
        result += "'"
        break
      case '"':
        result += '"'
        break
      case '0':
        result += '\0'
        break
      default:
        result += next
        break
    }
  }
  return result
}

/**
 * Parses `prompt={...}` expression source from propsFrom().
 */
function promptFromProps(props: Record<string, unknown>): string {
  const raw = props.prompt
  if (raw == null) return ''
  if (typeof raw !== 'string') return String(raw)
  return decodeJsStringLiteralSource(raw)
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
