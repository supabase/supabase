import { spawn } from 'node:child_process'
import path from 'node:path'
import dotenv from 'dotenv'

loadEnvFiles()

const passthroughArgs: string[] = []
const env = { ...process.env }

for (let index = 2; index < process.argv.length; index++) {
  const arg = process.argv[index]
  const next = process.argv[index + 1]

  if (arg === '--profile' && next) {
    env.ACCEPTANCE_PROFILE = next
    index++
    continue
  }

  if (arg.startsWith('--profile=')) {
    env.ACCEPTANCE_PROFILE = arg.slice('--profile='.length)
    continue
  }

  if (arg === '--target' && next) {
    env.ACCEPTANCE_TARGET = next
    index++
    continue
  }

  if (arg.startsWith('--target=')) {
    env.ACCEPTANCE_TARGET = arg.slice('--target='.length)
    continue
  }

  if (arg === '--base-url' && next) {
    env.ACCEPTANCE_BASE_URL = next
    index++
    continue
  }

  if (arg.startsWith('--base-url=')) {
    env.ACCEPTANCE_BASE_URL = arg.slice('--base-url='.length)
    continue
  }

  passthroughArgs.push(arg)
}

if (env.ACCEPTANCE_TLS_REJECT_UNAUTHORIZED === 'false') {
  env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

const child = spawn(
  localBin('vitest'),
  ['run', '--config', 'acceptance/acceptance.vitest.config.ts', ...passthroughArgs],
  {
    env,
    stdio: 'inherit',
  }
)

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 1)
})

function loadEnvFiles() {
  const acceptanceEnvPath = process.env.ACCEPTANCE_ENV_FILE ?? '.env.acceptance'

  dotenv.config({ path: path.resolve(acceptanceEnvPath), override: false })
}

function command(cmd: string) {
  return process.platform === 'win32' ? `${cmd}.cmd` : cmd
}

function localBin(cmd: string) {
  return path.resolve('node_modules', '.bin', command(cmd))
}
