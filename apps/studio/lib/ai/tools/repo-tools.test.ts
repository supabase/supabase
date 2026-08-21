import type { Experimental_SandboxSession } from 'ai'
import { describe, expect, it, vi } from 'vitest'

import { getRepoTools } from './repo-tools'

const executionOptions = (sandbox: Experimental_SandboxSession) =>
  ({
    toolCallId: 'call',
    messages: [],
    context: undefined,
    experimental_sandbox: sandbox,
  }) as any

function mockSandbox(): Experimental_SandboxSession {
  return {
    description: 'repo',
    run: vi.fn(async () => ({ exitCode: 0, stdout: 'src/index.ts:1:match', stderr: '' })),
    spawn: vi.fn(),
    readFile: vi.fn(),
    readBinaryFile: vi.fn(),
    readTextFile: vi.fn(async () => 'contents'),
    writeFile: vi.fn(),
    writeBinaryFile: vi.fn(),
    writeTextFile: vi.fn(async () => undefined),
  }
}

function setup() {
  const sandbox = mockSandbox()
  const openPullRequest = vi.fn(async () => ({
    url: 'https://github.com/acme/repo/pull/1',
    number: 1,
    branch: 'assistant/chat',
    sha: 'abc123',
  }))
  const tools = getRepoTools({
    connectionId: 42,
    authorization: 'Bearer token',
    baseRef: 'main',
    headBranch: 'assistant/chat',
    openPullRequest,
  })

  return { tools, sandbox, openPullRequest }
}

describe('getRepoTools', () => {
  it('quotes search input before running ripgrep', async () => {
    const { tools, sandbox } = setup()

    await tools.search_repo.execute?.({ query: "user's query" }, executionOptions(sandbox))

    expect(sandbox.run).toHaveBeenCalledWith(
      expect.objectContaining({ command: expect.stringContaining(`'user'"'"'s query'`) })
    )
  })

  it('prevents reads and writes outside the repository', async () => {
    const { tools, sandbox } = setup()

    await expect(
      tools.read_repo_file.execute?.({ path: '../secret' }, executionOptions(sandbox))
    ).rejects.toThrow('within the repository')
    await expect(
      tools.write_repo_file.execute?.(
        { path: '/tmp/secret', content: 'secret' },
        executionOptions(sandbox)
      )
    ).rejects.toThrow('within the repository')
  })

  it('writes repository files through the provided session', async () => {
    const { tools, sandbox } = setup()

    await tools.write_repo_file.execute?.(
      { path: 'src/index.ts', content: 'export {}' },
      executionOptions(sandbox)
    )

    expect(sandbox.writeTextFile).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'src/index.ts', content: 'export {}' })
    )
  })

  it('sends only the computed patch to the platform PR endpoint', async () => {
    const { tools, sandbox, openPullRequest } = setup()
    vi.mocked(sandbox.run).mockResolvedValueOnce({
      exitCode: 0,
      stdout: 'diff --git a/a b/a',
      stderr: '',
    })

    await tools.open_pull_request.execute?.({ title: 'Fix the issue' }, executionOptions(sandbox))

    expect(openPullRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionId: 42,
        baseRef: 'main',
        headBranch: 'assistant/chat',
        patch: 'diff --git a/a b/a',
      })
    )
  })
})
