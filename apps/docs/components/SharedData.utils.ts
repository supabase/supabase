import { at } from 'lodash-es'

/**
 * Resolves a path within a shared-data set. If the resolved value is an
 * object with `value`/`unit` fields, returns `${value} ${unit}` (trimmed);
 * otherwise returns the resolved primitive as-is.
 *
 * Lives in its own file (no `shared-data` import) so it can be reused from
 * the build-time markdown generator without forcing it to load the React
 * component file.
 */
export function resolveSharedData(dataset: unknown, path: string): string | number | undefined {
  const selected = at(dataset as any, [path])[0]
  if (typeof selected === 'object' && selected !== null) {
    return `${selected.value ?? ''} ${selected.unit ?? ''}`.trim()
  }
  return selected
}
