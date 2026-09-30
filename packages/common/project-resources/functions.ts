import { parse } from 'smol-toml'

import { isTestOrGeneratedPath, normalizeProjectPath } from './paths'
import type { ProjectFile, ProjectResource, ProjectResourceDiagnostic } from './types'

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function analyzeFunctions(
  files: readonly ProjectFile[],
  diagnostics: ProjectResourceDiagnostic[]
): ProjectResource[] {
  const config = files.find((file) => file.path === 'supabase/config.toml')
  let configured: Record<string, unknown> = {}
  if (config) {
    if (config.content === undefined) {
      diagnostics.push({
        code: 'missing-content',
        message:
          'Function configuration content is missing; only default index.ts entrypoints can be identified.',
        files: [config.path],
      })
    } else {
      try {
        const parsed = parse(config.content)
        if (parsed.functions !== undefined && !isObject(parsed.functions))
          throw new Error('Invalid functions table')
        configured = isObject(parsed.functions) ? parsed.functions : {}
      } catch {
        diagnostics.push({
          code: 'invalid-function-config',
          message:
            'Function configuration could not be parsed; function entrypoints were not inferred.',
          files: [config.path],
        })
        return []
      }
    }
  }

  const folders = new Map<string, ProjectFile[]>()
  for (const file of files) {
    const match = file.path.match(/^supabase\/functions\/([^/]+)\/(.+)$/)
    if (!match || match[1].startsWith('_') || isTestOrGeneratedPath(file.path)) continue
    const group = folders.get(match[1]) ?? []
    group.push(file)
    folders.set(match[1], group)
  }
  const paths = new Set(files.map((file) => file.path))
  const resources: ProjectResource[] = []
  for (const name of new Set([...folders.keys(), ...Object.keys(configured)])) {
    if (name.startsWith('_') || !/^[a-zA-Z0-9_-]+$/.test(name)) continue
    const settings = configured[name]
    if (settings !== undefined && !isObject(settings)) {
      diagnostics.push({
        code: 'invalid-function-config',
        message: `Invalid configuration for Edge Function "${name}".`,
        files: ['supabase/config.toml'],
      })
      continue
    }
    if (isObject(settings) && settings.enabled === false) continue
    const configuredEntrypoint = isObject(settings) ? settings.entrypoint : undefined
    const entrypoint =
      configuredEntrypoint === undefined
        ? `supabase/functions/${name}/index.ts`
        : typeof configuredEntrypoint === 'string'
          ? normalizeProjectPath(`supabase/${configuredEntrypoint.replace(/^(?:\.\/)+/, '')}`)
          : undefined
    if (!entrypoint || !paths.has(entrypoint) || isTestOrGeneratedPath(entrypoint)) {
      diagnostics.push({
        code: 'missing-function-entrypoint',
        message: `No supplied source file matches the entrypoint for Edge Function "${name}".`,
        files:
          settings === undefined
            ? (folders.get(name) ?? []).map((file) => file.path)
            : ['supabase/config.toml'],
      })
      continue
    }
    const implementation = (folders.get(name) ?? []).filter((file) =>
      /\.(?:[cm]?[jt]s|json|jsonc|lock)$/.test(file.path)
    )
    resources.push({
      id: `edge-function:${name}`,
      kind: 'edge-function',
      name,
      files: [...new Set([entrypoint, ...implementation.map((file) => file.path)])],
    })
  }
  return resources
}
