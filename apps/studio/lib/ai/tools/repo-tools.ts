import { posix } from 'node:path'
import { tool, type ToolExecutionOptions } from 'ai'
import { z } from 'zod'

import {
  createGitHubPullRequest,
  type GitHubPullRequest,
} from '@/data/integrations/github-connection-repo'

const MAX_TOOL_OUTPUT = 64 * 1024

function requireSandbox(options: ToolExecutionOptions<unknown>) {
  if (!options.experimental_sandbox) throw new Error('Repository workspace is unavailable')
  return options.experimental_sandbox
}

function repoPath(path: string) {
  const normalized = posix.normalize(path)
  if (posix.isAbsolute(path) || normalized === '..' || normalized.startsWith('../')) {
    throw new Error('Path must stay within the repository')
  }
  return normalized
}

function shellQuote(value: string) {
  return `'${value.replaceAll("'", `'"'"'`)}'`
}

function truncate(value: string) {
  const bytes = Buffer.from(value)
  return bytes.byteLength <= MAX_TOOL_OUTPUT
    ? value
    : `${bytes.subarray(0, MAX_TOOL_OUTPUT).toString('utf8')}\n… output truncated`
}

export function getRepoTools({
  connectionId,
  authorization,
  baseRef,
  headBranch,
  openPullRequest = createGitHubPullRequest,
}: {
  connectionId: number
  authorization: string
  baseRef: string
  headBranch: string
  openPullRequest?: typeof createGitHubPullRequest
}) {
  return {
    search_repo: tool({
      description: 'Search the connected repository for text or a regular expression.',
      inputSchema: z.object({
        query: z.string().min(1),
        glob: z.string().optional().describe('Optional file glob, for example **/*.ts.'),
      }),
      execute: async ({ query, glob }, options) => {
        const sandbox = requireSandbox(options)
        const globArgs = glob ? `--glob ${shellQuote(glob)}` : ''
        const result = await sandbox.run({
          command: `rg --line-number --color never --max-count 100 ${globArgs} -- ${shellQuote(query)} . || [ $? -eq 1 ]`,
          abortSignal: options.abortSignal,
        })
        return { matches: truncate(result.stdout) }
      },
    }),
    read_repo_file: tool({
      description: 'Read a UTF-8 text file from the connected repository.',
      inputSchema: z.object({
        path: z.string().min(1),
        startLine: z.number().int().positive().optional(),
        endLine: z.number().int().positive().optional(),
      }),
      execute: async ({ path, startLine, endLine }, options) => {
        const sandbox = requireSandbox(options)
        const content = await sandbox.readTextFile({
          path: repoPath(path),
          startLine,
          endLine,
          abortSignal: options.abortSignal,
        })
        if (content == null) throw new Error(`File not found: ${path}`)
        return { path, content: truncate(content) }
      },
    }),
    write_repo_file: tool({
      description: 'Create or replace a UTF-8 text file in the connected repository.',
      inputSchema: z.object({ path: z.string().min(1), content: z.string() }),
      execute: async ({ path, content }, options) => {
        const sandbox = requireSandbox(options)
        await sandbox.writeTextFile({
          path: repoPath(path),
          content,
          abortSignal: options.abortSignal,
        })
        return { path, bytes: Buffer.byteLength(content) }
      },
    }),
    open_pull_request: tool({
      description:
        'Ask the user to open a pull request containing every repository change made in this chat.',
      inputSchema: z.object({
        title: z.string().min(1).max(120),
        body: z.string().max(20_000).optional(),
      }),
      execute: async ({ title, body }, options): Promise<GitHubPullRequest> => {
        const sandbox = requireSandbox(options)
        const { stdout: patch } = await sandbox.run({
          command: 'git diff --binary --no-ext-diff',
          abortSignal: options.abortSignal,
        })
        if (!patch.trim()) throw new Error('There are no repository changes to open')

        return openPullRequest({
          connectionId,
          authorization,
          baseRef,
          headBranch,
          title,
          body,
          patch,
          signal: options.abortSignal,
        })
      },
    }),
  }
}

export type RepoTools = ReturnType<typeof getRepoTools>
