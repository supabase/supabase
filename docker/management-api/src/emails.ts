import { spawn } from 'node:child_process'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { transform } from 'esbuild'

export const GOTRUE_TEMPLATE_PROPS = {
  confirmationURL: '{{ .ConfirmationURL }}',
  token: '{{ .Token }}',
  tokenHash: '{{ .TokenHash }}',
  siteURL: '{{ .SiteURL }}',
  email: '{{ .Email }}',
  newEmail: '{{ .NewEmail }}',
  redirectTo: '{{ .RedirectTo }}',
  data: '{{ .Data }}',
  oldEmail: '{{ .OldEmail }}',
  phone: '{{ .Phone }}',
  oldPhone: '{{ .OldPhone }}',
  provider: '{{ .Provider }}',
  factorType: '{{ .FactorType }}',
} as const

export type GoTrueTemplateProps = Record<keyof typeof GOTRUE_TEMPLATE_PROPS, string>

const WORKER_PATH = fileURLToPath(new URL('./render-email-worker.js', import.meta.url))
const PACKAGE_ROOT = dirname(dirname(WORKER_PATH))
const WORKER_ARGV = [
  '--permission',
  `--allow-fs-read=${PACKAGE_ROOT}`,
  '--disallow-code-generation-from-strings',
  WORKER_PATH,
]
const RENDER_TIMEOUT_MS = 15_000
const MAX_SOURCE_BYTES = 512 * 1024
const MAX_OUTPUT_BYTES = 4 * 1024 * 1024

async function compileReactEmail(source: string): Promise<string> {
  const { code } = await transform(source, {
    loader: 'tsx',
    format: 'cjs',
    jsx: 'automatic',
    target: 'node20',
  })
  return code
}

export async function renderReactEmail(source: string): Promise<string> {
  if (Buffer.byteLength(source, 'utf8') > MAX_SOURCE_BYTES) {
    throw new Error('template source is too large')
  }

  const code = await compileReactEmail(source)

  const child = spawn(process.execPath, WORKER_ARGV, {
    cwd: PACKAGE_ROOT,
    env: {},
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  const stdout: Buffer[] = []
  let stdoutBytes = 0
  const stderr: Buffer[] = []

  const finished = new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      reject(new Error('rendering the template timed out'))
    }, RENDER_TIMEOUT_MS)

    child.stdout.on('data', (chunk: Buffer) => {
      stdoutBytes += chunk.length
      if (stdoutBytes > MAX_OUTPUT_BYTES) {
        child.kill('SIGKILL')
        return
      }
      stdout.push(chunk)
    })
    child.stderr.on('data', (chunk: Buffer) => stderr.push(chunk))
    child.on('error', (err) => {
      clearTimeout(timer)
      reject(err)
    })
    child.on('close', () => {
      clearTimeout(timer)
      resolve()
    })
  })

  child.stdin.end(JSON.stringify({ code, props: GOTRUE_TEMPLATE_PROPS }), 'utf8')
  await finished

  if (stdoutBytes > MAX_OUTPUT_BYTES) throw new Error('rendered template is too large')

  const raw = Buffer.concat(stdout).toString('utf8')
  let result: { html?: unknown; error?: unknown }
  try {
    result = JSON.parse(raw)
  } catch {
    const detail = Buffer.concat(stderr).toString('utf8').trim().split('\n').at(-1) ?? ''
    throw new Error(`template renderer failed${detail ? `: ${detail}` : ''}`)
  }

  if (typeof result.error === 'string') throw new Error(result.error)
  if (typeof result.html !== 'string') throw new Error('template renderer returned no HTML')
  return result.html
}
