import { describe, expect, it } from 'vitest'

import {
  hasCustomEmailSender,
  isCustomEmailTemplateEditingRestricted,
  isCustomEmailTemplateRestrictionStatusKnown,
} from './EmailTemplates.utils'
import type { Project } from '@/data/projects/project-detail-query'
import type { Organization } from '@/types'

const freeOrganization = { plan: { id: 'free', name: 'Free' } } as unknown as Organization
const proOrganization = { plan: { id: 'pro', name: 'Pro' } } as unknown as Organization
const restrictedProject = { inserted_at: '2026-05-01T00:00:00.000Z' } as unknown as Project
const restrictedFreeProject = {
  inserted_at: '2026-05-01T00:00:00.000Z',
  subscription_tier: 'tier_free',
} as unknown as Project
const restrictedProProject = {
  inserted_at: '2026-05-01T00:00:00.000Z',
  subscription_tier: 'tier_pro',
} as unknown as Project
const unrestrictedProject = { inserted_at: '2026-04-30T23:59:59.999Z' } as unknown as Project

describe('EmailTemplates.utils', () => {
  it('waits for auth config, organization plan, and project creation date before resolving restriction status', () => {
    expect(
      isCustomEmailTemplateRestrictionStatusKnown({
        authConfig: {},
        organization: freeOrganization,
        project: restrictedProject,
      })
    ).toBe(true)

    expect(
      isCustomEmailTemplateRestrictionStatusKnown({
        authConfig: undefined,
        organization: freeOrganization,
        project: restrictedProject,
      })
    ).toBe(false)

    expect(
      isCustomEmailTemplateRestrictionStatusKnown({
        authConfig: {},
        organization: undefined,
        project: restrictedProject,
      })
    ).toBe(false)

    expect(
      isCustomEmailTemplateRestrictionStatusKnown({
        authConfig: {},
        organization: freeOrganization,
        project: undefined,
      })
    ).toBe(false)
  })

  it('restricts free projects that use the built-in email sender', () => {
    expect(
      isCustomEmailTemplateEditingRestricted({
        authConfig: {},
        organization: freeOrganization,
        project: restrictedProject,
      })
    ).toBe(true)
  })

  it('restricts projects with a free project subscription even when organization plan data disagrees', () => {
    expect(
      isCustomEmailTemplateEditingRestricted({
        authConfig: {},
        organization: proOrganization,
        project: restrictedFreeProject,
      })
    ).toBe(true)
  })

  it('allows older free projects that use the built-in email sender', () => {
    expect(
      isCustomEmailTemplateEditingRestricted({
        authConfig: {},
        organization: freeOrganization,
        project: unrestrictedProject,
      })
    ).toBe(false)
  })

  it('allows free projects with custom SMTP configured', () => {
    const authConfig = {
      SMTP_ADMIN_EMAIL: 'support@example.com',
      SMTP_SENDER_NAME: 'Example',
      SMTP_USER: 'smtp-user',
      SMTP_HOST: 'smtp.example.com',
      SMTP_PASS: '******',
      SMTP_PORT: '587',
      SMTP_MAX_FREQUENCY: 60,
    }

    expect(hasCustomEmailSender(authConfig)).toBe(true)
    expect(
      isCustomEmailTemplateEditingRestricted({
        authConfig,
        organization: freeOrganization,
        project: restrictedProject,
      })
    ).toBe(false)
  })

  it('restricts free projects when custom SMTP is incomplete', () => {
    expect(
      isCustomEmailTemplateEditingRestricted({
        authConfig: {
          SMTP_ADMIN_EMAIL: 'support@example.com',
          SMTP_SENDER_NAME: 'Example',
          SMTP_USER: 'smtp-user',
          SMTP_HOST: 'smtp.example.com',
          SMTP_PORT: '587',
          SMTP_MAX_FREQUENCY: 60,
        },
        organization: freeOrganization,
        project: restrictedProject,
      })
    ).toBe(true)
  })

  it('allows free projects with a configured send-email hook', () => {
    expect(
      isCustomEmailTemplateEditingRestricted({
        authConfig: {
          HOOK_SEND_EMAIL_ENABLED: true,
          HOOK_SEND_EMAIL_URI: 'https://example.com/auth/send-email',
        },
        organization: freeOrganization,
        project: restrictedProject,
      })
    ).toBe(false)
  })

  it('allows paid projects using the built-in email sender', () => {
    expect(
      isCustomEmailTemplateEditingRestricted({
        authConfig: {},
        organization: proOrganization,
        project: restrictedProProject,
      })
    ).toBe(false)
  })
})
