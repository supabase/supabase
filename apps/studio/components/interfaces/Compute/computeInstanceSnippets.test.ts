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

  it('includes the Compute CLI setup and beta deploy command in the AI prompt', () => {
    const { aiPrompt } = buildComputeInstanceSnippets(input({ name: 'embed', access: 'private' }))

    expect(aiPrompt).toContain(
      'Run `export SUPABASE_EXPERIMENTAL_COMPUTE=1` in the current shell before running any Supabase CLI commands.'
    )
    expect(aiPrompt).toContain('Use `npx supabase@beta` for every Supabase CLI command.')
    expect(aiPrompt).toContain(
      'Run `npx supabase@beta compute push embed --exposure private` to deploy it.'
    )
  })
})

describe('buildComputeInstanceCliCommands', () => {
  it('targets the requested instance in every management command', () => {
    const commands = buildComputeInstanceCliCommands('embed')

    expect(commands).toHaveLength(4)
    expect(commands.every(({ command }) => command.includes('embed'))).toBe(true)
  })
})
