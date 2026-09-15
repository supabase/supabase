import * as z from 'zod'

import type { OrganizationMember } from '@/data/organizations/organization-members-query'

export const MAX_BATCH_INVITE_SIZE = 50

/** Max characters to show when an invalid token is long (e.g. comma-less paste of many addresses). */
const MAX_INVALID_EMAIL_SNIPPET_LENGTH = 120

function formatInvalidEmailSnippet(token: string): string {
  if (token.length <= MAX_INVALID_EMAIL_SNIPPET_LENGTH) return token
  return `${token.slice(0, MAX_INVALID_EMAIL_SNIPPET_LENGTH)}…`
}

export const emailSchema = z
  .string()
  .min(1, 'At least one email address is required')
  .refine(
    (val) => {
      const emails = parseEmails(val)
      if (emails.length === 0) return false
      return emails.every((e) => z.string().email().safeParse(e).success)
    },
    (val) => {
      const emails = parseEmails(val)
      const invalid = emails.find((e) => !z.string().email().safeParse(e).success)
      return {
        message: invalid
          ? `Invalid email address: "${formatInvalidEmailSnippet(invalid)}"`
          : 'At least one email address is required',
      }
    }
  )
  .refine(
    (val) => parseEmails(val).length <= MAX_BATCH_INVITE_SIZE,
    (val) => {
      const count = parseEmails(val).length
      return {
        message: `You can invite up to ${MAX_BATCH_INVITE_SIZE} members at a time. Remove ${count - MAX_BATCH_INVITE_SIZE} email ${count - MAX_BATCH_INVITE_SIZE === 1 ? 'address' : 'addresses'} to continue.`,
      }
    }
  )

export function parseEmails(value: string): string[] {
  const emails = value
    .split(/[\s,]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return [...new Set(emails)]
}

export type CategorizedEmails = {
  alreadyInvited: string[]
  alreadyMembers: string[]
  toInvite: string[]
}

export type BatchInvitationFailure = {
  email: string
  error: string
}

export type BatchInvitationResult = {
  succeeded: string[]
  failed: BatchInvitationFailure[]
}

export function categorizeInviteEmails(
  emails: string[],
  members: OrganizationMember[]
): CategorizedEmails {
  const alreadyInvited: string[] = []
  const alreadyMembers: string[] = []
  const toInvite: string[] = []

  for (const email of emails) {
    const existingMember = members.find((m) => m.primary_email === email)
    if (existingMember !== undefined) {
      if (existingMember.invited_id) {
        alreadyInvited.push(email)
      } else {
        alreadyMembers.push(email)
      }
    } else {
      toInvite.push(email)
    }
  }

  return { alreadyInvited, alreadyMembers, toInvite }
}

export function buildProjectPayload(
  applyToOrg: boolean,
  projectRef: string
): { projects: string[] } | Record<string, never> {
  if (applyToOrg) return {}
  if (!projectRef) {
    throw new Error('projectRef is required when applyToOrg is false')
  }
  return { projects: [projectRef] }
}

export function buildSsoPayload(
  requireSso: 'auto' | 'sso' | 'non-sso'
): { requireSso: boolean } | Record<string, never> {
  if (requireSso === 'sso') return { requireSso: true }
  if (requireSso === 'non-sso') return { requireSso: false }
  return {}
}
