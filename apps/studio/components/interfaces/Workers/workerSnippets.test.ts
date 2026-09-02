import { describe, expect, it } from 'vitest'

import { WORKERS_REGION } from './Workers.constants'
import { buildWorkerCliCommands, buildWorkerSnippets, EXAMPLE_WORKER } from './workerSnippets'

const input = (overrides: Partial<Parameters<typeof buildWorkerSnippets>[0]> = {}) => ({
  ...EXAMPLE_WORKER,
  endpoint: 'abcdefgh.supabase.co',
  ...overrides,
})

describe('buildWorkerSnippets', () => {
  it('points the invoke examples at the worker URL', () => {
    const { curl, javascript, python } = buildWorkerSnippets(input({ name: 'embed' }))
    const url = 'https://abcdefgh.supabase.co/workers/v1/embed'

    expect(curl).toContain(`'${url}'`)
    expect(javascript).toContain(`'${url}'`)
    expect(python).toContain(`"${url}"`)
  })

  it('leaves a placeholder invoke URL until the project settings resolve', () => {
    const { curl } = buildWorkerSnippets(input({ endpoint: undefined }))
    expect(curl).toContain('[YOUR WORKER URL]')
  })

  it('does not require authorization for the CLI invoke example', () => {
    expect(buildWorkerSnippets(input()).curl).not.toContain('Authorization')
  })

  it('asks for the anon key to invoke a public worker and the service role key for a private one', () => {
    expect(buildWorkerSnippets(input({ access: 'public' })).javascript).toContain('[YOUR ANON KEY]')
    expect(buildWorkerSnippets(input({ access: 'private' })).javascript).toContain(
      '[YOUR SERVICE ROLE KEY]'
    )
  })

  it('falls back to a placeholder name when the worker has none', () => {
    expect(buildWorkerSnippets(input({ name: '   ' })).cli).toContain('my-worker')
  })

  it('trims the name before interpolating it', () => {
    expect(buildWorkerSnippets(input({ name: '  embed  ' })).cli).toContain('new embed --runtime')
  })

  it('defaults the runtime when the API omits it', () => {
    expect(buildWorkerSnippets(input({ runtime: undefined })).cli).toContain('--runtime node')
  })

  it('writes the worker spec into the config.toml block', () => {
    const { configToml } = buildWorkerSnippets(
      input({
        name: 'embed',
        runtime: 'python',
        size: '4gb-2vcpu',
        access: 'private',
        instances: 3,
      })
    )

    expect(configToml).toContain('[workers.embed]')
    expect(configToml).toContain('runtime   = "python"')
    expect(configToml).toContain('size      = "4gb-2vcpu"    # 4 GB · 2 vCPU')
    expect(configToml).toContain('exposure  = "private"')
    expect(configToml).toContain('instances = 3')
    expect(configToml).toContain(WORKERS_REGION)
  })

  it('configures private workers for CLI deployment', () => {
    const { aiPrompt, cli } = buildWorkerSnippets(input({ access: 'private' }))

    expect(cli).toContain('--exposure private')
    expect(aiPrompt).toContain('push my-worker --exposure private')
    expect(cli).not.toContain('only deploy public workers')
    expect(aiPrompt).not.toContain('only deploy public workers')
  })
})

describe('buildWorkerCliCommands', () => {
  it('names the worker in every command', () => {
    const commands = buildWorkerCliCommands('embed')
    expect(commands).not.toHaveLength(0)
    for (const { command } of commands) {
      expect(command).toContain('embed')
    }
  })

  it('falls back to a placeholder name when the worker has none', () => {
    expect(buildWorkerCliCommands('  ')[0].command).toContain('my-worker')
  })
})
