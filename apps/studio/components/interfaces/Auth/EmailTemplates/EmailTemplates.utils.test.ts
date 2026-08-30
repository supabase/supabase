import { describe, expect, it } from 'vitest'

import {
  FREE_TIER_TEMPLATE_BLOCK_CUTOFF_DATE,
  hasCustomEmailSender,
  isCustomEmailTemplateEditingRestricted,
  isCustomEmailTemplateRestrictionStatusKnown,
  validateGoTemplate,
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

  describe('validateGoTemplate', () => {
    it('accepts valid template strings', () => {
      expect(validateGoTemplate('')).toEqual({ valid: true })
      expect(validateGoTemplate('<h2>Hello</h2>')).toEqual({ valid: true })
      expect(validateGoTemplate('<p><a href="{{ .ConfirmationURL }}">Confirm</a></p>')).toEqual({
        valid: true,
      })
      expect(
        validateGoTemplate(
          '{{ if .Data.name }}Hello {{ .Data.name }}{{ else }}Hello user{{ end }}'
        )
      ).toEqual({ valid: true })
      expect(validateGoTemplate('{{/* A Go comment */}} <p>{{ .SiteURL }}</p>')).toEqual({
        valid: true,
      })
      expect(validateGoTemplate('<p>{{ printf "Hello %s" .Email }}</p>')).toEqual({ valid: true })
    })

    it('rejects extra opening braces inside actions (e.g. {{{ .RedirectTo }}})', () => {
      const res = validateGoTemplate('<p><a href="{{{ .RedirectTo }}}">Sign in</a></p>')
      expect(res.valid).toBe(false)
      expect(res.error).toContain('Unexpected "{" in command')
    })

    it('rejects unclosed template actions', () => {
      const res = validateGoTemplate('<p>{{ .ConfirmationURL </p>')
      expect(res.valid).toBe(false)
      expect(res.error).toBe('Unclosed template action "{{ ... }}"')
    })

    it('rejects empty template actions', () => {
      const res = validateGoTemplate('<p>{{ }}</p>')
      expect(res.valid).toBe(false)
      expect(res.error).toBe('Empty template action "{{ }}"')
    })

    it('rejects invalid syntax like default: "test"', () => {
      const res = validateGoTemplate('<p>{{ .Data.display_name | default: "test" }}</p>')
      expect(res.valid).toBe(false)
      expect(res.error).toContain('Unexpected ":" in command')
    })

    it('rejects unclosed or unexpected control structures', () => {
      expect(validateGoTemplate('{{ if .Email }} Hi')).toEqual({
        valid: false,
        error: 'Unclosed control structure "{{ if .Email }}"',
      })
      expect(validateGoTemplate('{{ end }}')).toEqual({
        valid: false,
        error: 'Unexpected "{{ end }}" without matching block',
      })
      expect(validateGoTemplate('{{ else }}')).toEqual({
        valid: false,
        error: 'Unexpected "{{ else }}" without matching block',
      })
    })

    it('rejects unclosed parenthesized expressions', () => {
      expect(validateGoTemplate('{{ (print .Email }}')).toEqual({
        valid: false,
        error: 'Unclosed parenthesized expression in command',
      })
      expect(validateGoTemplate('{{ print .Email ) }}')).toEqual({
        valid: false,
        error: 'Unexpected ")" in command',
      })
    })
  })
})

