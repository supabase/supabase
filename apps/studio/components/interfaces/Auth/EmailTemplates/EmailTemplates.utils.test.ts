import { describe, expect, it } from 'vitest'

import {
  FREE_TIER_TEMPLATE_BLOCK_CUTOFF_DATE,
  getEmailTemplateIssues,
  hasCustomEmailSender,
  isCustomEmailTemplateEditingRestricted,
  isCustomEmailTemplateRestrictionStatusKnown,
} from './EmailTemplates.utils'
import type { Organization } from '@/types'

const freeOrganization = { plan: { id: 'free', name: 'Free' } } as unknown as Organization
const proOrganization = { plan: { id: 'pro', name: 'Pro' } } as unknown as Organization

// Dates relative to the cutoff
const PRE_CUTOFF = '2025-01-01T00:00:00Z'
const POST_CUTOFF = '2026-12-01T00:00:00Z'

describe('EmailTemplates.utils', () => {
  it('waits for auth config, organization, and project before resolving restriction status', () => {
    expect(
      isCustomEmailTemplateRestrictionStatusKnown({
        authConfig: {},
        organization: freeOrganization,
        projectInsertedAt: POST_CUTOFF,
      })
    ).toBe(true)

    expect(
      isCustomEmailTemplateRestrictionStatusKnown({
        authConfig: undefined,
        organization: freeOrganization,
        projectInsertedAt: POST_CUTOFF,
      })
    ).toBe(false)

    expect(
      isCustomEmailTemplateRestrictionStatusKnown({
        authConfig: {},
        organization: undefined,
        projectInsertedAt: POST_CUTOFF,
      })
    ).toBe(false)

    expect(
      isCustomEmailTemplateRestrictionStatusKnown({
        authConfig: {},
        organization: freeOrganization,
        projectInsertedAt: undefined,
      })
    ).toBe(false)
  })

  it('restricts post-cutoff free projects that use the built-in email sender', () => {
    expect(
      isCustomEmailTemplateEditingRestricted({
        authConfig: {},
        organization: freeOrganization,
        projectInsertedAt: POST_CUTOFF,
      })
    ).toBe(true)
  })

  it('does not restrict pre-cutoff free projects (grandfathered)', () => {
    expect(
      isCustomEmailTemplateEditingRestricted({
        authConfig: {},
        organization: freeOrganization,
        projectInsertedAt: PRE_CUTOFF,
      })
    ).toBe(false)
  })

  it('uses the correct cutoff date', () => {
    expect(FREE_TIER_TEMPLATE_BLOCK_CUTOFF_DATE).toBe('2026-06-03T00:00:00Z')
  })

  it('allows paid projects that use the built-in email sender', () => {
    expect(
      isCustomEmailTemplateEditingRestricted({
        authConfig: {},
        organization: proOrganization,
        projectInsertedAt: POST_CUTOFF,
      })
    ).toBe(false)
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
        projectInsertedAt: POST_CUTOFF,
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
        projectInsertedAt: POST_CUTOFF,
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
        projectInsertedAt: POST_CUTOFF,
      })
    ).toBe(false)
  })
})

describe('getEmailTemplateIssues', () => {
  // Template from https://github.com/supabase/supabase/issues/36990
  const recoveryBody =
    '<p><a href="{{ .ConfirmationURL }}/?token_hash={{ .TokenHash }}&flow=reset_password&email={{ .Email }}">Reset Password</a></p>'

  it('returns no issues for empty content', () => {
    expect(getEmailTemplateIssues(undefined)).toEqual([])
    expect(getEmailTemplateIssues('')).toEqual([])
  })

  it('returns no issues when ConfirmationURL is the entire value', () => {
    const body = '<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>'

    expect(getEmailTemplateIssues(body)).toEqual([])
  })

  it('flags parameters appended after ConfirmationURL', () => {
    expect(getEmailTemplateIssues(recoveryBody)).toEqual([
      {
        type: 'appended-after-confirmation-url',
        snippet: '{{ .ConfirmationURL }}/?token_hash=',
      },
    ])
  })

  it('flags query strings and fragments appended after ConfirmationURL', () => {
    expect(
      getEmailTemplateIssues('<p>Visit {{ .ConfirmationURL }}?code=1</p>')
    ).toEqual([
      { type: 'appended-after-confirmation-url', snippet: '{{ .ConfirmationURL }}?code=1' },
    ])

    expect(getEmailTemplateIssues('<a href="{{ .ConfirmationURL }}#section">Link</a>')).toEqual([
      { type: 'appended-after-confirmation-url', snippet: '{{ .ConfirmationURL }}#section' },
    ])
  })

  it('does not flag trailing punctuation or a closing tag after ConfirmationURL', () => {
    expect(getEmailTemplateIssues('<p>Visit {{ .ConfirmationURL }}</p>')).toEqual([])
    expect(getEmailTemplateIssues('<p>Visit {{ .ConfirmationURL }}.</p>')).toEqual([])
  })

  it('flags misspelled casing of the ConfirmationURL variable', () => {
    expect(getEmailTemplateIssues('<a href="{{ .ConfirmationUrl }}">Link</a>')).toEqual([
      { type: 'case-mismatched-confirmation-url', snippet: '{{ .ConfirmationUrl }}' },
    ])

    expect(getEmailTemplateIssues('<a href="{{.confirmationurl}}">Link</a>')).toEqual([
      { type: 'case-mismatched-confirmation-url', snippet: '{{.confirmationurl}}' },
    ])
  })

  it('does not flag the documented custom link built from SiteURL and TokenHash', () => {
    const body =
      '<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Reset Password</a>'

    expect(getEmailTemplateIssues(body)).toEqual([])
  })

  it('ignores unrelated template variables', () => {
    const body = '<p>{{ .Token }} {{ .Email }} {{ .SiteURL }}/reset</p>'

    expect(getEmailTemplateIssues(body)).toEqual([])
  })
})
