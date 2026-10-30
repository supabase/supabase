import { describe, expect, it } from 'vitest'

import {
  buildComputeInstanceCliCommands,
  buildComputeInstanceSnippets,
  EXAMPLE_COMPUTE_INSTANCE,
} from './computeInstanceSnippets'

const input = (overrides: Partial<Parameters<typeof buildComputeInstanceSnippets>[0]> = {}) => ({
  ...EXAMPLE_COMPUTE_INSTANCE,
  endpoint: 'abcdefgh.supabase.co',
  ...overrides,
})

describe('buildComputeInstanceSnippets', () => {
  it('passes private exposure to the CLI and config', () => {
    const { cli, configToml } = buildComputeInstanceSnippets(input({ access: 'private' }))

    expect(cli).toContain('--exposure private')
    expect(configToml).toContain('exposure  = "private"')
  })
})

describe('buildComputeInstanceCliCommands', () => {
  it('targets the requested instance in every management command', () => {
    const commands = buildComputeInstanceCliCommands('embed')

    expect(commands).toHaveLength(4)
    expect(commands.every(({ command }) => command.includes('embed'))).toBe(true)
  })
})
