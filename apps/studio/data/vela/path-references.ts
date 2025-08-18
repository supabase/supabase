import { getOrganizationSlug } from './organization-path-slug'
import { getProjectRef } from './project-path-ref'

export function getPathReferences(): { slug?: string, ref?: string} {
  return {
    slug: getOrganizationSlug(),
    ref: getProjectRef(),
  }
}