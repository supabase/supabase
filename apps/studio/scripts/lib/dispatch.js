const VALID_TARGETS = new Set(['dev', 'build', 'start'])
const VALID_SCRIPTS = new Set(
  [...VALID_TARGETS].flatMap((target) => [`${target}:next`, `${target}:tanstack`])
)

// Arguments forwarded to the dispatched script end up interpolated into a
// single command string on Windows, so they are restricted to a conservative
// token shape. Nothing carrying whitespace, quotes or shell metacharacters can
// reach cmd.exe through this path.
const SAFE_FORWARDED_ARG = /^[\w.:=-]+$/

export const DEFAULT_STUDIO_PORT = 8082

// `vite dev` runs with a larger heap. This used to be a `NODE_OPTIONS=…`
// prefix inside the npm script, which is POSIX-only syntax.
export const TANSTACK_DEV_NODE_OPTIONS = '--max-old-space-size=8192'

// Resolve the dev-server port from the first candidate that is set, falling
// back to the default. Returns `null` when a candidate is set but is not a
// valid port, so the caller can fail with a clear message instead of handing
// nonsense to the dev server.
export function resolveStudioPort(...candidates) {
  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null || candidate === '') continue
    const port = Number(candidate)
    if (!Number.isInteger(port) || port < 0 || port > 65535) return null
    return port
  }
  return DEFAULT_STUDIO_PORT
}

// The port flag differs per framework: next takes `-p`, vite takes `--port`.
// Only the dev targets take one — `start:next` pins its own port and the build
// targets do not listen.
export function getDevServerArgs(script, port) {
  if (!VALID_SCRIPTS.has(script) || !script.startsWith('dev:')) return []
  return [script === 'dev:tanstack' ? '--port' : '-p', String(port)]
}

// Build and start do not consume STUDIO_PORT, so an unrelated value in the
// environment must not block them. Dev targets resolve the first configured
// candidate and return null when it is not a valid port.
export function resolveDevServerArgs(script, ...portCandidates) {
  if (!VALID_SCRIPTS.has(script)) return null
  if (!script.startsWith('dev:')) return []

  const port = resolveStudioPort(...portCandidates)
  if (port === null) return null
  return getDevServerArgs(script, port)
}

// Environment for the dispatched child, kept here so the Windows and POSIX
// paths cannot drift apart.
export function getChildEnv(script, env = {}) {
  if (script !== 'dev:tanstack') return { ...env }
  return { ...env, NODE_OPTIONS: TANSTACK_DEV_NODE_OPTIONS }
}

export function getPnpmSpawnInvocation(script, platform = process.platform, scriptArgs = []) {
  if (!VALID_SCRIPTS.has(script)) return null
  if (!scriptArgs.every((arg) => SAFE_FORWARDED_ARG.test(arg))) return null

  const forwarded = scriptArgs.length > 0 ? ['--', ...scriptArgs] : []

  if (platform === 'win32') {
    return {
      command: ['pnpm', 'run', script, ...forwarded].join(' '),
      args: [],
      options: { shell: true },
    }
  }

  return {
    command: 'pnpm',
    args: ['run', script, ...forwarded],
    options: { shell: false },
  }
}

export function getDispatchScript(target, studioFramework) {
  if (!VALID_TARGETS.has(target)) return null

  const framework = studioFramework === 'tanstack' ? 'tanstack' : 'next'
  return `${target}:${framework}`
}
