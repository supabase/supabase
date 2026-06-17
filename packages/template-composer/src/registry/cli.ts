import { normalizeRegistrySlug, REGISTRY_GITHUB_SLUG, toRegistryDependencyRef } from './schema'

export const SHADCN_CLI = 'npx shadcn@latest'

export interface RegistryCommandOptions {
  registrySlug?: string
}

export function getRegistryAddCommand(
  templateId: string,
  options?: RegistryCommandOptions
): string {
  const registrySlug = getCommandRegistrySlug(options)

  return `${SHADCN_CLI} add ${toRegistryDependencyRef(templateId, registrySlug)}`
}

export function getRegistryViewCommand(
  templateId: string,
  options?: RegistryCommandOptions
): string {
  const registrySlug = getCommandRegistrySlug(options)

  return `${SHADCN_CLI} view ${toRegistryDependencyRef(templateId, registrySlug)}`
}

export function getRegistrySearchCommand(query = '', options?: RegistryCommandOptions): string {
  const trimmed = query.trim()
  const registrySlug = getCommandRegistrySlug(options)

  if (!trimmed) {
    return `${SHADCN_CLI} list ${registrySlug}`
  }

  return `${SHADCN_CLI} search ${registrySlug} -q ${shellQuote(trimmed)}`
}

function getCommandRegistrySlug(options: RegistryCommandOptions | undefined): string {
  return normalizeRegistrySlug(options?.registrySlug ?? REGISTRY_GITHUB_SLUG)
}

function shellQuote(value: string): string {
  if (/^[a-zA-Z0-9._/-]+$/.test(value)) {
    return value
  }

  return `'${value.replace(/'/g, "'\\''")}'`
}
