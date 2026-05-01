import { isSmtpEnabled } from '../SmtpForm/SmtpForm.utils'
import type { components } from '@/data/api'
import type { Project } from '@/data/projects/project-detail-query'
import type { Organization } from '@/types'

type AuthConfig = components['schemas']['GoTrueConfigResponse']
const CUSTOM_EMAIL_TEMPLATES_RESTRICTED_PROJECT_CUTOFF = '2026-05-01T00:00:00.000Z'

/**
 * Convert template title to URL-friendly slug
 * Shared function to ensure slug matching works correctly across multiple files
 * Necessary because TEMPLATES_SCHEMAS does not provide a slug for each template
 */
export const slugifyTitle = (title: string) => {
  return title.trim().replace(/\s+/g, '-').toLowerCase()
}

export const hasCustomEmailSender = (config?: Partial<AuthConfig>) => {
  const hasSendEmailHook = !!config?.HOOK_SEND_EMAIL_ENABLED && !!config?.HOOK_SEND_EMAIL_URI

  return isSmtpEnabled(config) || hasSendEmailHook
}

export const isProjectInCustomEmailTemplateRestrictedCohort = (
  project?: Pick<Project, 'inserted_at'>
) => {
  const projectInsertedAtMs = Date.parse(project?.inserted_at ?? '')

  return (
    Number.isFinite(projectInsertedAtMs) &&
    projectInsertedAtMs >= Date.parse(CUSTOM_EMAIL_TEMPLATES_RESTRICTED_PROJECT_CUTOFF)
  )
}

export const isCustomEmailTemplateRestrictionStatusKnown = ({
  authConfig,
  organization,
  project,
}: {
  authConfig?: Partial<AuthConfig>
  organization?: Organization
  project?: Pick<Project, 'inserted_at'>
}) => {
  return (
    authConfig !== undefined &&
    organization?.plan.id !== undefined &&
    Number.isFinite(Date.parse(project?.inserted_at ?? ''))
  )
}

export const isCustomEmailTemplateEditingRestricted = ({
  authConfig,
  organization,
  project,
}: {
  authConfig?: Partial<AuthConfig>
  organization?: Organization
  project?: Pick<Project, 'inserted_at'>
}) => {
  return (
    organization?.plan.id === 'free' &&
    isProjectInCustomEmailTemplateRestrictedCohort(project) &&
    !hasCustomEmailSender(authConfig)
  )
}
