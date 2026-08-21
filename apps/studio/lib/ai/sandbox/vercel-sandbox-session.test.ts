import type { Sandbox } from '@vercel/sandbox'
import { describe, expect, it, vi } from 'vitest'

import { createLazySandboxSession, type RepoArchive } from './vercel-sandbox-session'

const archive: RepoArchive = {
  url: 'https://example.com/repo.tar.gz',
  ref: 'main',
  sha: 'abc123',
  repository: { owner: 'supabase', name: 'example' },
}

function finished({ stdout = '', stderr = '', exitCode = 0 } = {}) {
  return {
    exitCode,
    stdout: vi.fn(async () => stdout),
    stderr: vi.fn(async () => stderr),
  }
}

function setup() {
  const sandbox = {
    readFileToBuffer: vi.fn(async () => Buffer.from('one\ntwo\nthree')),
    runCommand: vi.fn(async () => finished()),
    writeFiles: vi.fn(async () => undefined),
  }
  const getOrCreate = vi.fn(async (options: Parameters<typeof Sandbox.getOrCreate>[0]) => {
    await options?.onCreate?.(sandbox as unknown as Sandbox)
    return sandbox as unknown as Pick<Sandbox, 'readFileToBuffer' | 'runCommand' | 'writeFiles'>
  })

  return { sandbox, factory: { getOrCreate } }
}

describe('createLazySandboxSession', () => {
  it('creates the workspace lazily and only once', async () => {
    const { sandbox, factory } = setup()
    const session = createLazySandboxSession({
      projectRef: 'project',
      chatId: 'chat',
      archive,
      factory,
    })

    expect(factory.getOrCreate).not.toHaveBeenCalled()

    await session.run({ command: 'pwd' })
    await session.readTextFile({ path: 'README.md' })

    expect(factory.getOrCreate).toHaveBeenCalledTimes(1)
    expect(sandbox.runCommand).toHaveBeenCalledTimes(2)
  })

  it('checks command exit codes instead of treating stderr as success', async () => {
    const { sandbox, factory } = setup()
    sandbox.runCommand
      .mockResolvedValueOnce(finished())
      .mockResolvedValueOnce(finished({ exitCode: 2, stderr: 'bad command' }))
    const session = createLazySandboxSession({
      projectRef: 'project',
      chatId: 'chat',
      archive,
      factory,
    })

    await expect(session.run({ command: 'false' })).rejects.toThrow('bad command')
  })

  it('supports 1-based inclusive line ranges', async () => {
    const { factory } = setup()
    const session = createLazySandboxSession({
      projectRef: 'project',
      chatId: 'chat',
      archive,
      factory,
    })

    await expect(
      session.readTextFile({ path: 'README.md', startLine: 2, endLine: 3 })
    ).resolves.toBe('two\nthree')
  })

  it('does not tie workspace lifetime to a request abort signal', async () => {
    const { factory } = setup()
    const session = createLazySandboxSession({
      projectRef: 'project',
      chatId: 'chat',
      archive,
      factory,
    })
    const controller = new AbortController()

    await session.readTextFile({ path: 'README.md', abortSignal: controller.signal })
    controller.abort()
    await session.readTextFile({ path: 'README.md' })

    expect(factory.getOrCreate).toHaveBeenCalledTimes(1)
  })
})
