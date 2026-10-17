import { beforeAll, describe, expect, it } from 'vitest'

import { collectReferenceContent } from './build-reference-content'
import { generateDartReferenceDump } from './generate-dart-reference'

function serialize(content: {
  bySlug: unknown
  flat: unknown
  sections: unknown
  functionsList: unknown
  typeSpec: unknown
}): string {
  const seen = new WeakSet<object>()
  const breakCycles = (_key: string, value: unknown) => {
    if (value && typeof value === 'object') {
      if (seen.has(value as object)) return '[Circular]'
      seen.add(value as object)
    }
    return value
  }
  const { bySlug, flat, sections, functionsList, typeSpec } = content
  return JSON.stringify({ bySlug, flat, sections, functionsList, typeSpec }, breakCycles, 2)
}

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
describe.skip('build-reference-content: javascript/v2', () => {
  it('matches snapshot', async () => {
    const content = await collectReferenceContent('javascript', 'v2')
    await expect(serialize(content)).toMatchFileSnapshot(
      './__snapshots__/build-reference-content.v2.json'
    )
  })
})

/**
 * Dart/v2 has no upstream TypeDoc dump; its source is regenerated from the
 * committed `spec/supabase_dart_v2.yml` by `generate-dart-reference.ts`. We run
 * that converter first so the snapshot covers the full conversion + build path
 * (YAML to dump to content) and surfaces any drift in either step.
 *
 * ---
 *
 * Update on Jun 30th, 2026. Skipping this for the same reason as the
 * javascript/v2 suite above, until snapshot updates are decoupled from
 * unrelated builds.
 */
describe.skip('build-reference-content: dart/v2', () => {
  beforeAll(async () => {
    await generateDartReferenceDump()
  })

  it('matches snapshot', async () => {
    const content = await collectReferenceContent('dart', 'v2')
    await expect(serialize(content)).toMatchFileSnapshot(
      './__snapshots__/build-reference-content.dart.v2.json'
    )
  })
})
