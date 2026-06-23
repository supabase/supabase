import { at } from 'lodash-es'

/**
 * Resolves a dot/bracket path within a shared-data dataset. If the resolved
 * value is an object with `value`/`unit` fields, returns `${value} ${unit}`
 * (trimmed); otherwise returns the resolved primitive as-is.
 *
 * Pure: no `shared-data` import. Callers supply the dataset so this util can
 * be reused by the React `<SharedData>` component (Next.js bundle) and by the
 * build-time markdown-schema handler (tsx) without each having to navigate
 * `shared-data`'s ESM/CJS interop independently.
 */
export function resolveSharedDataPath(dataset: unknown, path: string): string | number | undefined {
  const selected = at(dataset as any, [path])[0]
  if (typeof selected === 'object' && selected !== null) {
    return `${(selected as any).value ?? ''} ${(selected as any).unit ?? ''}`.trim()
  }
  return selected
}
