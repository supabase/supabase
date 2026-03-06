type JsonPrimitive = string | number | boolean | null
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

export function resolveTemplateJsonRelativePaths(
  value: JsonValue,
  templateJsonUrl: string
): JsonValue {
  if (typeof value === 'string') {
    return value.startsWith('./') ? new URL(value, templateJsonUrl).toString() : value
  }

  if (Array.isArray(value)) {
    return value.map((entry) => resolveTemplateJsonRelativePaths(entry, templateJsonUrl))
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        resolveTemplateJsonRelativePaths(entry, templateJsonUrl),
      ])
    )
  }

  return value
}
