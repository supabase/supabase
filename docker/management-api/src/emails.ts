import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

export {
  GOTRUE_TEMPLATE_PROPS,
  type GoTrueTemplateProps,
} from './render-email-worker.js'

const IS_TS_SOURCE = import.meta.url.endsWith('.ts')
const WORKER_PATH = fileURLToPath(
  new URL(IS_TS_SOURCE ? './render-email-worker.ts' : './render-email-worker.js', import.meta.url)
)
const WORKER_ARGV = IS_TS_SOURCE ? ['--import', 'tsx', WORKER_PATH] : [WORKER_PATH]
const RENDER_TIMEOUT_MS = 15_000
const MAX_SOURCE_BYTES = 512 * 1024
const MAX_OUTPUT_BYTES = 4 * 1024 * 1024

export async function renderReactEmail(source: string): Promise<string> {
  if (Buffer.byteLength(source, 'utf8') > MAX_SOURCE_BYTES) {
    throw new Error('template source is too large')
  }

  const child = spawn(process.execPath, WORKER_ARGV, {
    env: { EMAIL_RENDER_WORKER: '1', ...(IS_TS_SOURCE ? { PATH: process.env.PATH ?? '' } : {}) },
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

  child.stdin.end(source, 'utf8')
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
