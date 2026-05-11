import { isSmtpEnabled } from '../SmtpForm/SmtpForm.utils'
import type { components } from '@/data/api'
import type { Organization } from '@/types'

type AuthConfig = components['schemas']['GoTrueConfigResponse']

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

export const isCustomEmailTemplateRestrictionStatusKnown = ({
  authConfig,
}: {
  authConfig?: Partial<AuthConfig>
  organization?: Organization
}) => {
  return authConfig !== undefined
}

export const isCustomEmailTemplateEditingRestricted = ({
  authConfig,
}: {
  authConfig?: Partial<AuthConfig>
  organization?: Organization
}) => {
  // Temporary Studio-only paygate while Platform/Auth own the exact eligibility cohort.
  return !hasCustomEmailSender(authConfig)
}
