import { describe, expect, it } from 'vitest'

import {
  hasCustomEmailSender,
  isCustomEmailTemplateEditingRestricted,
} from './EmailTemplates.utils'
import type { Project } from '@/data/projects/project-detail-query'
import type { Organization } from '@/types'

const freeOrganization = { plan: { id: 'free', name: 'Free' } } as unknown as Organization
const proOrganization = { plan: { id: 'pro', name: 'Pro' } } as unknown as Organization
const restrictedProject = { inserted_at: '2026-05-01T00:00:00.000Z' } as unknown as Project
const unrestrictedProject = { inserted_at: '2026-04-30T23:59:59.999Z' } as unknown as Project

describe('EmailTemplates.utils', () => {
  it('restricts free projects that use the built-in email sender', () => {
    expect(
      isCustomEmailTemplateEditingRestricted({
        authConfig: {},
        organization: freeOrganization,
        project: restrictedProject,
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
        project: restrictedProject,
      })
    ).toBe(false)
  })
})
