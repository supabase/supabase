import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { INTEGRATION_OVERVIEW_IDS } from './overviews'

const INTEGRATIONS_DIR = join(__dirname)

const idsOnDisk = readdirSync(INTEGRATIONS_DIR)
  .filter((entry) => {
    try {
      return statSync(join(INTEGRATIONS_DIR, entry, 'overview.md')).isFile()
    } catch {
      return false
    }
  })
  .sort()

describe('integration overview registry', () => {
  // The registry uses literal import specifiers (required for both bundlers
  // to statically analyze them), so it can't glob the directory at runtime.
  // This keeps it honest: adding/removing an overview.md must be mirrored in
  // overviews.ts.
  it('stays in sync with static-data/integrations/*/overview.md', () => {
    expect([...INTEGRATION_OVERVIEW_IDS].sort()).toEqual(idsOnDisk)
  })
})
