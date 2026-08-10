import type { GitHubConfigResponse } from './github-config.types'

export type GitHubConfigTarget = 'development' | 'preview' | 'production'

export interface ResolveGitHubConfigOptions {
  target: GitHubConfigTarget
  gitBranch?: string
}

export interface GitHubConfigResolvedLayer {
  kind: 'base' | 'branch' | 'environment'
  path: string
}

export interface EffectiveGitHubConfigResult {
  config: Record<string, unknown>
  layers: GitHubConfigResolvedLayer[]
}

const DELETE_DIRECTIVE = '$delete'

/**
 * Resolves the parsed single-file config model into the desired configuration
 * for a production project or preview branch.
 */
export function resolveEffectiveGitHubConfig(
  config: Record<string, unknown>,
  options: ResolveGitHubConfigOptions
): Record<string, unknown> {
  return resolveEffectiveGitHubConfigWithLayers(config, options).config
}

/**
 * Resolves effective configuration and reports the physical layers that were
 * actually present and applied, in merge order.
 */
export function resolveEffectiveGitHubConfigWithLayers(
  config: Record<string, unknown>,
  { target, gitBranch }: ResolveGitHubConfigOptions
): EffectiveGitHubConfigResult {
  const { env, ...baseConfig } = config
  let effectiveConfig = deepMergeConfig({}, baseConfig)
  const layers: GitHubConfigResolvedLayer[] = [{ kind: 'base', path: 'base' }]

  if (isRecord(env)) {
    const targetConfig = env[target]

    if (isRecord(targetConfig)) {
      if (target !== 'preview') {
        effectiveConfig = deepMergeConfig(effectiveConfig, targetConfig)
        layers.push({ kind: 'environment', path: `env.${target}` })
      } else {
        const { branches, ...previewConfig } = targetConfig
        effectiveConfig = deepMergeConfig(effectiveConfig, previewConfig)
        layers.push({ kind: 'environment', path: 'env.preview' })

        const branchConfig =
          gitBranch &&
          isRecord(branches) &&
          Object.prototype.hasOwnProperty.call(branches, gitBranch)
            ? branches[gitBranch]
            : undefined

        if (isRecord(branchConfig)) {
          effectiveConfig = deepMergeConfig(effectiveConfig, branchConfig)
          layers.push({
            kind: 'branch',
            path: `env.preview.branches.${JSON.stringify(gitBranch)}`,
          })
        }
      }
    }
  }

  // The environment control container never belongs to the effective service configuration.
  delete effectiveConfig.env

  return { config: effectiveConfig, layers }
}

export function resolveGitHubConfigResponse(
  response: GitHubConfigResponse,
  options: ResolveGitHubConfigOptions
): GitHubConfigResponse {
  return {
    ...response,
    config: resolveEffectiveGitHubConfig(response.config, options),
  }
}

function deepMergeConfig(
  base: Record<string, unknown>,
  overlay: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base }
  const deleteKeys = overlay[DELETE_DIRECTIVE]

  if (deleteKeys !== undefined) {
    if (!Array.isArray(deleteKeys) || deleteKeys.some((key) => typeof key !== 'string')) {
      throw new Error(`Overlay directive "${DELETE_DIRECTIVE}" must be an array of sibling keys`)
    }

    for (const key of deleteKeys) delete result[key]
  }

  for (const [key, overlayValue] of Object.entries(overlay)) {
    if (key === DELETE_DIRECTIVE) continue

    if (overlayValue === null) {
      delete result[key]
    } else if (isRecord(overlayValue)) {
      const baseValue = isRecord(result[key]) ? result[key] : {}
      result[key] = deepMergeConfig(baseValue, overlayValue)
    } else {
      result[key] = overlayValue
    }
  }

  return result
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
