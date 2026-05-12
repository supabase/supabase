import { SupportFormUrlKeys } from '@/components/interfaces/Support/SupportForm.utils'

export function getSupportLinkQueryParams(
  project: { ref?: string; parent_project_ref?: string } | undefined,
  org: { slug?: string } | undefined,
  routerRef: string | undefined
): Partial<SupportFormUrlKeys> | undefined {
  const projectRef = project?.parent_project_ref ?? project?.ref ?? routerRef
  if (projectRef) return { projectRef }
  if (org?.slug) return { orgSlug: org.slug }
  return undefined
}
