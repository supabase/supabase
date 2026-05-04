import { describe, expect, it } from 'vitest'

import {
  hasCustomEmailSender,
  isCustomEmailTemplateEditingRestricted,
  isCustomEmailTemplateRestrictionStatusKnown,
} from './EmailTemplates.utils'
import type { Organization } from '@/types'

const freeOrganization = { plan: { id: 'free', name: 'Free' } } as unknown as Organization
const proOrganization = { plan: { id: 'pro', name: 'Pro' } } as unknown as Organization

describe('EmailTemplates.utils', () => {
  it('waits for auth config before resolving restriction status', () => {
    expect(
      isCustomEmailTemplateRestrictionStatusKnown({
        authConfig: {},
        organization: freeOrganization,
      })
    ).toBe(true)

    expect(
      isCustomEmailTemplateRestrictionStatusKnown({
        authConfig: undefined,
        organization: freeOrganization,
      })
    ).toBe(false)
  })

  it('restricts projects that use the built-in email sender', () => {
    expect(
      isCustomEmailTemplateEditingRestricted({
        authConfig: {},
        organization: freeOrganization,
      })
    ).toBe(true)

    expect(
      isCustomEmailTemplateEditingRestricted({
        authConfig: {},
        organization: proOrganization,
      })
    ).toBe(true)
  })

  it('allows projects with custom SMTP configured', () => {
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
      })
    ).toBe(false)
  })

  it('restricts projects when custom SMTP is incomplete', () => {
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
      })
    ).toBe(true)
  })

  it('allows projects with a configured send-email hook', () => {
    expect(
      isCustomEmailTemplateEditingRestricted({
        authConfig: {
          HOOK_SEND_EMAIL_ENABLED: true,
          HOOK_SEND_EMAIL_URI: 'https://example.com/auth/send-email',
        },
        organization: freeOrganization,
      })
    ).toBe(false)
  })
})
