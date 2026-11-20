import { describe, expect, it } from 'vitest'

import {
  AUTH_EMAIL_TEMPLATES_TERMINOLOGY_ANCHOR,
  EMAIL_TEMPLATE_DOCS_ANCHORS,
} from './EmailTemplates.constants'
import { AUTH_TEMPLATE_TYPES, type AuthTemplateType } from './EmailTemplates.types'

/** Docs section headings from customizing-email-templates.mdx */
const DOCS_HEADINGS: Record<AuthTemplateType, string> = {
  CONFIRMATION: 'auth.email.template.confirmation',
  INVITE: 'auth.email.template.invite',
  MAGIC_LINK: 'auth.email.template.magic_link',
  EMAIL_CHANGE: 'auth.email.template.email_change',
  RECOVERY: 'auth.email.template.recovery',
  REAUTHENTICATION: 'auth.email.template.reauthentication',
  PASSWORD_CHANGED_NOTIFICATION: 'auth.email.notification.password_changed',
  EMAIL_CHANGED_NOTIFICATION: 'auth.email.notification.email_changed',
  PHONE_CHANGED_NOTIFICATION: 'auth.email.notification.phone_changed',
  IDENTITY_LINKED_NOTIFICATION: 'auth.email.notification.identity_linked',
  IDENTITY_UNLINKED_NOTIFICATION: 'auth.email.notification.identity_unlinked',
  MFA_FACTOR_ENROLLED_NOTIFICATION: 'auth.email.notification.mfa_factor_enrolled',
  MFA_FACTOR_UNENROLLED_NOTIFICATION: 'auth.email.notification.mfa_factor_unenrolled',
}

/**
 * Matches docs `Heading` anchor generation in
 * packages/ui/src/components/CustomHTMLElements/CustomHTMLElements.utils.ts
 */
function docsHeadingToAnchor(heading: string) {
  return heading
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9- ]/g, '')
    .replace(/[ ]/g, '-')
}

describe('EmailTemplates.constants: AUTH_EMAIL_TEMPLATES_TERMINOLOGY_ANCHOR', () => {
  it('matches auth-email-templates.mdx heading slug', () => {
    expect(AUTH_EMAIL_TEMPLATES_TERMINOLOGY_ANCHOR).toBe(docsHeadingToAnchor('Terminology'))
  })
})

describe('EmailTemplates.constants: EMAIL_TEMPLATE_DOCS_ANCHORS', () => {
  it('covers every auth template type', () => {
    expect(Object.keys(EMAIL_TEMPLATE_DOCS_ANCHORS).sort()).toEqual([...AUTH_TEMPLATE_TYPES].sort())
  })

  it.each(AUTH_TEMPLATE_TYPES)('matches docs heading slug for %s', (templateType) => {
    const expectedAnchor = docsHeadingToAnchor(DOCS_HEADINGS[templateType])

    expect(EMAIL_TEMPLATE_DOCS_ANCHORS[templateType]).toBe(expectedAnchor)
  })
})
