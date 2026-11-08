import { join } from 'node:path'
import { loadCliSpecFile } from '~/features/docs/Reference.cliSpec'
import { describe, expect, it } from 'vitest'

import { parseCliSpec } from './CliSpec'

const SPEC_DIRECTORY = join(__dirname, '../../spec')

describe('CLI spec loading', () => {
  it('accepts the checked-in 001 and 002 specs', async () => {
    const v2 = await loadCliSpecFile(SPEC_DIRECTORY, 'cli_v2_commands')
    const v3 = await loadCliSpecFile(SPEC_DIRECTORY, 'cli_v3_commands')
    expect(v2.clispec).toBe('002')
    expect(v3.clispec).toBe('002')
    expect(v2.commands.find((c) => c.id === 'supabase-db-push')).toMatchObject({
      breaking_changes: [{ id: 'target-flags-default', major: 3, direction: 'upcoming' }],
    })
    expect(v3.commands.find((c) => c.id === 'supabase-db-push')).toMatchObject({
      breaking_changes: [{ id: 'target-flags-default', major: 3, direction: 'changed' }],
    })
  })

  it('lists the failing paths', async () => {
    const spec = await loadCliSpecFile(SPEC_DIRECTORY, 'cli_v3_commands')
    const broken = structuredClone(spec) as any
    broken.commands[0].breaking_changes = [{ id: 'x', major: 'three', summary: 's' }]
    expect(() => parseCliSpec(broken, 'broken.yaml')).toThrow(
      /broken\.yaml: invalid clispec 002[\s\S]*commands\.0\.breaking_changes\.0\.major/
    )
  })

  it('rejects unknown clispec versions and 002-only keys on 001', () => {
    expect(() => parseCliSpec({ clispec: '999' })).toThrow(/unsupported clispec "999"/)
    expect(() => parseCliSpec({ clispec: '001', prerelease: true })).toThrow(/prerelease/)
  })
})
