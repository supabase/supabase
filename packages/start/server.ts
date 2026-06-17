import { createGitHubTemplateSource } from 'template-composer'

import type { Template } from './src/lib/template-catalog'
import { getStartTemplateRef, getStartTemplateRepository } from './src/lib/template-registry-config'

export { getStartTemplateRepository } from './src/lib/template-registry-config'

const DEFAULT_REVALIDATE_SECONDS = 3600

export async function getStartTemplates(): Promise<Template[]> {
  return createGitHubTemplateSource({
    repository: getStartTemplateRepository(),
    ref: getStartTemplateRef(),
    next: { revalidate: readRevalidateSeconds() },
  }).listTemplates()
}

function readRevalidateSeconds(): number {
  const value = Number(process.env.START_TEMPLATE_REVALIDATE_SECONDS)
  return Number.isFinite(value) && value >= 0 ? value : DEFAULT_REVALIDATE_SECONDS
}
