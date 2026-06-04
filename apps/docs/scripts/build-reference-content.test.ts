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
 */
describe('build-reference-content — javascript/v2', () => {
  it('matches snapshot', async () => {
    const { bySlug, flat, sections, functionsList, typeSpec } = await collectReferenceContent(
      'javascript',
      'v2'
    )
    expect({ bySlug, flat, sections, functionsList, typeSpec }).toMatchSnapshot()
  })
})
