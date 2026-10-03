import { spawn } from 'node:child_process'
import path from 'node:path'

const FLAME_MD_FORMATS = new Set(['summary', 'detailed', 'adaptive'])

export function normalizeFlameEnvironment(env: NodeJS.ProcessEnv) {
  const nextEnv = { ...env }

  if (nextEnv.FLAME_SOURCEMAPS_DIRS && !nextEnv.FLAME_SOURCEMAP_DIRS) {
    nextEnv.FLAME_SOURCEMAP_DIRS = nextEnv.FLAME_SOURCEMAPS_DIRS
  }

  return nextEnv
}

export function resolveFlameMdFormat(value: string | undefined) {
  if (!value) {
    return
  }

  const normalized = value.trim().toLowerCase()
  if (!FLAME_MD_FORMATS.has(normalized)) {
    throw new Error(`Invalid PPROF_FLAME_MD_FORMAT: ${value}`)
  }

  return normalized
}

export function getFlameCommand() {
  return path.resolve(
    process.cwd(),
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'flame.cmd' : 'flame'
  )
}

export function buildFlameGenerateArgs(profilePath: string, mdFormat?: string) {
  const args = ['generate']

  if (mdFormat) {
    args.push(`--md-format=${mdFormat}`)
  }

  args.push(profilePath)
  return args
}

export async function generateFlameArtifacts(
  profilePath: string,
  options?: {
    env?: NodeJS.ProcessEnv
    mdFormat?: string
  }
) {
  const env = normalizeFlameEnvironment(options?.env ?? process.env)
  const args = buildFlameGenerateArgs(profilePath, options?.mdFormat)

  await new Promise<void>((resolve, reject) => {
    const child = spawn(getFlameCommand(), args, {
      env,
      stdio: 'inherit',
    })

    child.once('error', reject)
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolve()
        return
      }

      if (signal) {
        reject(new Error(`@platformatic/flame exited via signal ${signal}`))
        return
      }

      reject(new Error(`@platformatic/flame exited with status ${code ?? 'unknown'}`))
    })
  })
}
