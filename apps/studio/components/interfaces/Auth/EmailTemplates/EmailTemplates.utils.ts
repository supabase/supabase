import dayjs from 'dayjs'

import { isSmtpEnabled } from '../SmtpForm/SmtpForm.utils'
import { type AuthTemplateType, type KebabCase } from './EmailTemplates.types'
import type { components } from '@/data/api'
import type { Organization } from '@/types'

type AuthConfig = components['schemas']['GoTrueConfigResponse']

/**
 * Projects created on or after this date are subject to the free-tier template editing
 * restriction. Projects created before it are grandfathered and keep editing access.
 * Must stay in sync with FREE_TIER_TEMPLATE_BLOCK_CUTOFF_DATE in the platform.
 */
export const FREE_TIER_TEMPLATE_BLOCK_CUTOFF_DATE = '2026-06-03T00:00:00Z'

/**
 * Convert template title to URL-friendly slug
 * Shared function to ensure slug matching works correctly across multiple files
 * Necessary because TEMPLATES_SCHEMAS does not provide a slug for each template
 */
export const slugifyTitle = (title: string) => {
  return title.trim().replace(/\s+/g, '-').toLowerCase()
}

/* Convert upper camel case to lower kebab case  */
export const getAuthTemplateType = <T extends AuthTemplateType>(id: T) =>
  id.toLowerCase().replace(/_/g, '-') as KebabCase<T>

export const hasCustomEmailSender = (config?: Partial<AuthConfig>) => {
  const hasSendEmailHook = !!config?.HOOK_SEND_EMAIL_ENABLED && !!config?.HOOK_SEND_EMAIL_URI

  return isSmtpEnabled(config) || hasSendEmailHook
}

export const isCustomEmailTemplateRestrictionStatusKnown = ({
  authConfig,
  organization,
  projectInsertedAt,
}: {
  authConfig?: Partial<AuthConfig>
  organization?: Organization
  projectInsertedAt?: string
}) => {
  return authConfig !== undefined && organization !== undefined && projectInsertedAt !== undefined
}

export const isBeforeFreeTierTemplateBlockCutoff = (projectInsertedAt?: string) => {
  return dayjs(projectInsertedAt).isBefore(FREE_TIER_TEMPLATE_BLOCK_CUTOFF_DATE)
}

export const isCustomEmailTemplateEditingRestricted = ({
  authConfig,
  organization,
  projectInsertedAt,
}: {
  authConfig?: Partial<AuthConfig>
  organization?: Organization
  projectInsertedAt?: string
}) => {
  const isPaidPlan = organization?.plan?.id !== undefined && organization.plan.id !== 'free'
  if (isPaidPlan) return false

  // Grandfathering: projects created before the cutoff date keep editing access.
  // Mirrors FREE_TIER_TEMPLATE_BLOCK_CUTOFF_DATE enforcement in the platform.
  if (projectInsertedAt && isBeforeFreeTierTemplateBlockCutoff(projectInsertedAt)) {
    return false
  }

  // Temporary Studio-side paygate while Platform/Auth own the exact eligibility cohort.
  return !hasCustomEmailSender(authConfig)
}
