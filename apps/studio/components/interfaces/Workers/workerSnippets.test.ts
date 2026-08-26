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
    const { javascript, python } = buildWorkerSnippets(input({ name: 'embed' }))
    const url = 'https://abcdefgh.supabase.co/workers/v1/embed'

    expect(javascript).toContain(`'${url}'`)
    expect(python).toContain(`"${url}"`)
  })

  it('leaves a placeholder invoke URL until the project settings resolve', () => {
    const { javascript } = buildWorkerSnippets(input({ endpoint: undefined }))
    expect(javascript).toContain('[YOUR WORKER URL]')
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

  it('passes instances as a flag on push — size and access have no CLI route yet', () => {
    const { cli } = buildWorkerSnippets(input({ instances: 5 }))
    expect(cli).toContain('push my-worker --instances 5')
    expect(cli).not.toContain('--size')
    expect(cli).not.toContain('--access')
  })

  it('warns that the CLI cannot deploy a private worker yet', () => {
    expect(buildWorkerSnippets(input({ access: 'private' })).cli).toContain(
      'can only deploy public workers'
    )
    expect(buildWorkerSnippets(input({ access: 'public' })).cli).not.toContain(
      'can only deploy public workers'
    )
  })

  it('tells the AI prompt to scaffold a directory for the worker runtime', () => {
    const { aiPrompt } = buildWorkerSnippets(input({ name: 'embed', runtime: 'deno' }))

    expect(aiPrompt).toContain('supabase/workers/embed/')
    expect(aiPrompt).toContain('Deno 2')
    expect(aiPrompt).toContain('[workers.embed]')
    expect(aiPrompt).toContain('supabase workers push embed')
  })

  it('warns the AI prompt that a private worker needs the management API instead', () => {
    expect(buildWorkerSnippets(input({ access: 'private' })).aiPrompt).toContain(
      'can only deploy public workers'
    )
    expect(buildWorkerSnippets(input({ access: 'public' })).aiPrompt).not.toContain(
      'can only deploy public workers'
    )
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
    expect(configToml).toContain('access    = "private"')
    expect(configToml).toContain('instances = 3')
    expect(configToml).toContain(WORKERS_REGION)
  })

  describe('curl', () => {
    it('mints an upload slot, uploads the build context, then deploys', () => {
      const { curl } = buildWorkerSnippets(input({ name: 'embed', projectRef: 'abcdefgh' }))

      expect(curl).toContain(
        `POST 'https://api.supabase.com/v2/projects/abcdefgh/workers/embed/uploads'`
      )
      expect(curl).toContain(`PUT '[PRESIGNED UPLOAD URL]'`)
      expect(curl).toContain(
        `POST 'https://api.supabase.com/v2/projects/abcdefgh/workers/embed/deploy'`
      )
    })

    it('leaves a placeholder project ref until it is known', () => {
      const { curl } = buildWorkerSnippets(input({ projectRef: undefined }))
      expect(curl).toContain('/projects/[YOUR PROJECT REF]/workers/')
    })

    it("sends the full spec, mapping access to the API's exposure field", () => {
      const { curl } = buildWorkerSnippets(
        input({ runtime: 'python', size: '4gb-2vcpu', access: 'private', instances: 3 })
      )

      expect(curl).toContain('"runtime":"python"')
      expect(curl).toContain('"size":"4gb-2vcpu"')
      expect(curl).toContain('"exposure":"private"')
      expect(curl).toContain('"instances":3')
    })

    it('omits the runtime key for a Dockerfile worker', () => {
      const { curl } = buildWorkerSnippets(input({ runtime: 'dockerfile' }))
      expect(curl).not.toContain('"runtime"')
    })
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
