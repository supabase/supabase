import { describe, expect, it } from 'vitest'

import {
  buildInstanceCliCommands,
  buildInstanceSnippets,
  EXAMPLE_INSTANCE,
} from './instanceSnippets'

const input = (overrides: Partial<Parameters<typeof buildInstanceSnippets>[0]> = {}) => ({
  ...EXAMPLE_INSTANCE,
  endpoint: 'abcdefgh.supabase.co',
  ...overrides,
})

describe('buildInstanceSnippets', () => {
  it('passes private exposure to the CLI and config', () => {
    const { cli, configToml } = buildInstanceSnippets(input({ access: 'private' }))

    expect(cli).toContain('--exposure private')
    expect(configToml).toContain('exposure  = "private"')
  })
})

describe('buildInstanceCliCommands', () => {
  it('targets the requested instance in every management command', () => {
    const commands = buildInstanceCliCommands('embed')

    expect(commands).toHaveLength(4)
    expect(commands.every(({ command }) => command.includes('embed'))).toBe(true)
  })
})
