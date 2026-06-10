import { REGISTRY_GITHUB_SLUG, toRegistryDependencyRef } from './schema'

export const SHADCN_CLI = 'npx shadcn@latest'

export function getRegistryAddCommand(templateId: string): string {
  return `${SHADCN_CLI} add ${toRegistryDependencyRef(templateId)}`
}

export function getRegistryViewCommand(templateId: string): string {
  return `${SHADCN_CLI} view ${toRegistryDependencyRef(templateId)}`
}

export function getRegistrySearchCommand(query = ''): string {
  const trimmed = query.trim()

  if (!trimmed) {
    return `${SHADCN_CLI} list ${REGISTRY_GITHUB_SLUG}`
  }

  return `${SHADCN_CLI} search ${REGISTRY_GITHUB_SLUG} -q ${shellQuote(trimmed)}`
}

function shellQuote(value: string): string {
  if (/^[a-zA-Z0-9._/-]+$/.test(value)) {
    return value
  }

  return `'${value.replace(/'/g, "'\\''")}'`
}
