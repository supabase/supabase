import { Sandbox, type Command } from '@vercel/sandbox'
import type { Experimental_SandboxSession } from 'ai'

import {
  REPO_ROOT,
  SANDBOX_COMMAND_TIMEOUT_MS,
  SANDBOX_OUTPUT_LIMIT_BYTES,
  SANDBOX_TIMEOUT_MS,
} from './sandbox-config'
import { sandboxNameFor } from './sandbox-name'

export type RepoArchive = {
  url: string
  ref: string
  sha: string
  repository: { owner: string; name: string }
}

type SandboxHandle = Pick<Sandbox, 'readFileToBuffer' | 'runCommand' | 'writeFiles'>

type SandboxFactory = {
  getOrCreate: (options: Parameters<typeof Sandbox.getOrCreate>[0]) => Promise<SandboxHandle>
}

function truncate(value: string, limit = SANDBOX_OUTPUT_LIMIT_BYTES) {
  const bytes = Buffer.from(value)
  if (bytes.byteLength <= limit) return value
  return `${bytes.subarray(0, limit).toString('utf8')}\n… output truncated`
}

function commandError(command: string, stderr: string, exitCode: number) {
  return new Error(`Repository command failed (${exitCode}): ${command}\n${truncate(stderr)}`)
}

async function collectCommand(command: Command, abortSignal?: AbortSignal) {
  const [finished, stdout, stderr] = await Promise.all([
    command.wait({ signal: abortSignal }),
    command.stdout({ signal: abortSignal }),
    command.stderr({ signal: abortSignal }),
  ])
  return { exitCode: finished.exitCode, stdout: truncate(stdout), stderr: truncate(stderr) }
}

function commandStreams(command: Command, abortSignal?: AbortSignal) {
  const stdout = new TransformStream<Uint8Array, Uint8Array>()
  const stderr = new TransformStream<Uint8Array, Uint8Array>()
  const stdoutWriter = stdout.writable.getWriter()
  const stderrWriter = stderr.writable.getWriter()
  const encoder = new TextEncoder()

  void (async () => {
    try {
      for await (const line of command.logs({ signal: abortSignal })) {
        const writer = line.stream === 'stdout' ? stdoutWriter : stderrWriter
        await writer.write(encoder.encode(line.data))
      }
      await Promise.all([stdoutWriter.close(), stderrWriter.close()])
    } catch (error) {
      await Promise.all([stdoutWriter.abort(error), stderrWriter.abort(error)])
    }
  })()

  return { stdout: stdout.readable, stderr: stderr.readable }
}

export function createLazySandboxSession({
  projectRef,
  chatId,
  archive,
  factory = Sandbox,
}: {
  projectRef: string
  chatId: string
  archive: RepoArchive
  factory?: SandboxFactory
}): Experimental_SandboxSession {
  let sandboxPromise: Promise<SandboxHandle> | undefined

  const getSandbox = () => {
    sandboxPromise ??= factory
      .getOrCreate({
        name: sandboxNameFor({ projectRef, chatId }),
        source: { type: 'tarball', url: archive.url },
        persistent: true,
        keepLastSnapshots: { count: 1 },
        timeout: SANDBOX_TIMEOUT_MS,
        resources: { vcpus: 2 },
        networkPolicy: 'deny-all',
        onCreate: async (sandbox) => {
          const setup = await sandbox.runCommand({
            cmd: 'bash',
            args: [
              '-lc',
              'git init && git config user.name "Supabase Assistant" && git config user.email "assistant@supabase.io" && git add -A && git commit --allow-empty -m "Repository snapshot"',
            ],
            cwd: REPO_ROOT,
            timeoutMs: SANDBOX_COMMAND_TIMEOUT_MS,
          })
          if (setup.exitCode !== 0) {
            throw commandError(
              'initialize repository snapshot',
              await setup.stderr(),
              setup.exitCode
            )
          }
        },
      })
      .catch((error) => {
        sandboxPromise = undefined
        throw error
      })

    return sandboxPromise
  }

  const runCommand = async (command: string, abortSignal?: AbortSignal) => {
    const sandbox = await getSandbox()
    const result = await sandbox.runCommand({
      cmd: 'bash',
      args: ['-lc', command],
      cwd: REPO_ROOT,
      signal: abortSignal,
      timeoutMs: SANDBOX_COMMAND_TIMEOUT_MS,
    })
    const [stdout, stderr] = await Promise.all([
      result.stdout({ signal: abortSignal }),
      result.stderr({ signal: abortSignal }),
    ])

    if (result.exitCode !== 0) throw commandError(command, stderr, result.exitCode)
    return { exitCode: result.exitCode, stdout: truncate(stdout), stderr: truncate(stderr) }
  }

  const readBinaryFile = async ({
    path,
    abortSignal,
  }: {
    path: string
    abortSignal?: AbortSignal
  }) => {
    const sandbox = await getSandbox()
    const value = await sandbox.readFileToBuffer({ path, cwd: REPO_ROOT }, { signal: abortSignal })
    return value == null ? null : new Uint8Array(value)
  }

  return {
    description: `Repository ${archive.repository.owner}/${archive.repository.name} at ${archive.ref} (${archive.sha}) is available in ${REPO_ROOT}. Network access is disabled.`,
    run: ({ command, abortSignal }) => runCommand(command, abortSignal),
    spawn: async ({ command, abortSignal }) => {
      const sandbox = await getSandbox()
      const process = await sandbox.runCommand({
        cmd: 'bash',
        args: ['-lc', command],
        cwd: REPO_ROOT,
        detached: true,
        signal: abortSignal,
      })
      const streams = commandStreams(process, abortSignal)

      return {
        stdout: streams.stdout,
        stderr: streams.stderr,
        wait: async () => {
          const result = await collectCommand(process, abortSignal)
          if (result.exitCode !== 0) throw commandError(command, result.stderr, result.exitCode)
          return { exitCode: result.exitCode }
        },
        kill: () => process.kill('SIGTERM', { abortSignal }),
      }
    },
    readFile: async (options) => {
      const value = await readBinaryFile(options)
      return value == null
        ? null
        : new ReadableStream<Uint8Array>({
            start(controller) {
              controller.enqueue(value)
              controller.close()
            },
          })
    },
    readBinaryFile,
    readTextFile: async ({ path, encoding = 'utf-8', startLine, endLine, abortSignal }) => {
      const value = await readBinaryFile({ path, abortSignal })
      if (value == null) return null
      const text = new TextDecoder(encoding).decode(value)
      if (startLine == null && endLine == null) return text
      return text
        .split('\n')
        .slice(Math.max((startLine ?? 1) - 1, 0), endLine)
        .join('\n')
    },
    writeFile: async ({ path, content, abortSignal }) => {
      const bytes = new Uint8Array(await new Response(content).arrayBuffer())
      const sandbox = await getSandbox()
      await sandbox.writeFiles([{ path, content: bytes }], { signal: abortSignal })
    },
    writeBinaryFile: async ({ path, content, abortSignal }) => {
      const sandbox = await getSandbox()
      await sandbox.writeFiles([{ path, content }], { signal: abortSignal })
    },
    writeTextFile: async ({ path, content, abortSignal }) => {
      const sandbox = await getSandbox()
      await sandbox.writeFiles([{ path, content }], { signal: abortSignal })
    },
  }
}
