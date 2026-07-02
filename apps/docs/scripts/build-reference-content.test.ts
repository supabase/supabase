import { describe, expect, it } from 'vitest'

import { collectReferenceContent } from './build-reference-content'

/**
 * Regression guard for the new reference-content pipeline. Snapshots the five
 * derived artifacts produced for `javascript/v2` so that any change in the
 * extraction logic (or in the upstream supabase-js TypeDoc output) shows up
 * as a snapshot diff in CI rather than silently shifting what the renderer
 * sees. When the supabase-js `make` workflow lands a new release in
 * `spec/reference/javascript/v2/`, re-run with `--update` to refresh the
 * baseline as part of the same PR.
 *
 * Serializes to a JSON string first so vitest's `pretty-format` serializer
 * doesn't collapse deep / cyclic structures (typeSpec contains
 * self-referencing builder types) into `[Object]` placeholders — which would
 * make param renames, signature changes, and JSDoc edits invisible.
 *
 * ---
 *
 * Update on Jun 30th, 2026. Skipping this until we figure out a better way to
 * avoid downloaded typedoc files to block build on unrelated PRs.
 */
describe.skip('build-reference-content — javascript/v2', () => {
  it('matches snapshot', async () => {
    const { bySlug, flat, sections, functionsList, typeSpec } = await collectReferenceContent(
      'javascript',
      'v2'
    )
    const seen = new WeakSet<object>()
    const breakCycles = (_key: string, value: unknown) => {
      if (value && typeof value === 'object') {
        if (seen.has(value as object)) return '[Circular]'
        seen.add(value as object)
      }
      return value
    }
    const json = JSON.stringify({ bySlug, flat, sections, functionsList, typeSpec }, breakCycles, 2)
    await expect(json).toMatchFileSnapshot('./__snapshots__/build-reference-content.v2.json')
  })
})
