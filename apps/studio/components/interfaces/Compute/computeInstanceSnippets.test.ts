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

describe('the agent skill snippet', () => {
  it('names the skill and links the guide', () => {
    const { skill } = buildComputeInstanceSnippets(input({ name: 'embed' }))

    expect(skill).toContain('name: supabase-compute')
    expect(skill).toContain('/guides/ai-tools/compute-private-alpha')
  })

  it('carries the configured instance through the config block and the deploy commands', () => {
    const { skill, cli, configToml } = buildComputeInstanceSnippets(
      input({ name: 'embed', runtime: 'deno', size: '4gb-2vcpu', instances: 3 })
    )

    expect(skill).toContain('[compute.embed]')
    expect(skill).toContain('instances = 3')
    expect(skill).toContain(cli)
    // The skill embeds the same block as the config.toml tab, minus its file comment.
    expect(configToml).toContain('[compute.embed]')
  })

  it('tells the agent how to call a public instance', () => {
    const { skill } = buildComputeInstanceSnippets(input({ name: 'embed', access: 'public' }))

    expect(skill).toContain('curl https://abcdefgh.supabase.co/compute/v1/embed')
  })

  it('explains that a private instance has no URL', () => {
    const { skill } = buildComputeInstanceSnippets(input({ name: 'embed', access: 'private' }))

    expect(skill).toContain('A private instance has no URL')
    expect(skill).not.toContain('curl https://')
  })
})

describe('buildComputeInstanceCliCommands', () => {
  it('targets the requested instance in every management command', () => {
    const commands = buildComputeInstanceCliCommands('embed')

    expect(commands).toHaveLength(4)
    expect(commands.every(({ command }) => command.includes('embed'))).toBe(true)
  })
})
