import { describe, expect, it } from 'vitest'

import {
  buildComputeInstanceCliCommands,
  buildComputeInstanceSnippets,
  computeLogsCommand,
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

  it('writes the CLI size name to config.toml, not the API one', () => {
    const { configToml, aiPrompt } = buildComputeInstanceSnippets(input({ size: '4gb-2vcpu' }))

    expect(configToml).toContain('size      = "4gb"    # 4 GB · 2 vCPU')
    expect(aiPrompt).toContain('size      = "4gb"')
  })

  it('tells the reader to enable the experimental compute commands', () => {
    const { aiPrompt, cli, configToml } = buildComputeInstanceSnippets(input())

    expect(aiPrompt).toContain('`compute = true` under the `[experimental]` table')
    expect(configToml).toContain('compute = true under [experimental]')
    expect(cli).toContain('export SUPABASE_EXPERIMENTAL_COMPUTE=1')
  })

  it('points Dockerfile apps at $PORT instead of a garbled entrypoint', () => {
    const { aiPrompt } = buildComputeInstanceSnippets(input({ runtime: 'dockerfile' }))

    expect(aiPrompt).toContain('serves plain HTTP on the port in $PORT')
    expect(aiPrompt).not.toContain('entrypoint (Dockerfile)')
  })

  it('asks for a background worker, not an HTTP server, for private instances', () => {
    const { aiPrompt } = buildComputeInstanceSnippets(input({ access: 'private' }))

    expect(aiPrompt).toContain('background worker')
    expect(aiPrompt).not.toContain('serves plain HTTP')
  })

  it('calls public instances without an API key', () => {
    const { javascript, python } = buildComputeInstanceSnippets(input())

    expect(javascript).not.toContain('Authorization')
    expect(python).not.toContain('Authorization')
  })
})

describe('buildComputeInstanceCliCommands', () => {
  it('targets the requested instance in every management command', () => {
    const commands = buildComputeInstanceCliCommands('embed')

    expect(commands).toHaveLength(3)
    expect(commands.every(({ command }) => command.includes('embed'))).toBe(true)
    expect(commands.some(({ command }) => command.includes(' pull '))).toBe(false)
    expect(commands).toContainEqual({
      comment: 'View logs',
      command: 'supabase logs --remote --service compute --resource embed --since 24h',
    })
  })

  it('passes the log kind when given one', () => {
    expect(computeLogsCommand('embed', 'app')).toBe(
      'supabase logs --remote --service compute --resource embed --since 24h --kind app'
    )
  })

  it('sets exposure on compute new so a plain push keeps it', () => {
    const { cli, aiPrompt } = buildComputeInstanceSnippets(input({ access: 'private' }))

    expect(cli).toContain(
      'new my-instance --runtime node --size 2gb --exposure private --instances 1'
    )
    expect(cli).toMatch(/push my-instance$/m)
    expect(aiPrompt).toContain('push my-instance --yes')
  })
})
