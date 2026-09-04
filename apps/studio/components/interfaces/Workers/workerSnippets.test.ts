import { describe, expect, it } from 'vitest'

import { buildWorkerCliCommands, buildWorkerSnippets, EXAMPLE_WORKER } from './workerSnippets'

const input = (overrides: Partial<Parameters<typeof buildWorkerSnippets>[0]> = {}) => ({
  ...EXAMPLE_WORKER,
  endpoint: 'abcdefgh.supabase.co',
  ...overrides,
})

describe('buildWorkerSnippets', () => {
  it('passes private exposure to the CLI and config', () => {
    const { cli, configToml } = buildWorkerSnippets(input({ access: 'private' }))

    expect(cli).toContain('--exposure private')
    expect(configToml).toContain('exposure  = "private"')
  })
})

describe('buildWorkerCliCommands', () => {
  it('targets the requested worker in every management command', () => {
    const commands = buildWorkerCliCommands('embed')

    expect(commands).toHaveLength(4)
    expect(commands.every(({ command }) => command.includes('embed'))).toBe(true)
  })
})
