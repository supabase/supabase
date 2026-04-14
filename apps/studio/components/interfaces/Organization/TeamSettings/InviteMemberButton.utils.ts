import type { OrganizationMember } from '@/data/organizations/organization-members-query'

export function parseEmails(value: string): string[] {
  return value
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
}

export type CategorizedEmails = {
  alreadyInvited: string[]
  alreadyMembers: string[]
  toInvite: string[]
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
  return !applyToOrg && projectRef ? { projects: [projectRef] } : {}
}

export function buildSsoPayload(
  requireSso: 'auto' | 'sso' | 'non-sso'
): { requireSso: boolean } | Record<string, never> {
  if (requireSso === 'sso') return { requireSso: true }
  if (requireSso === 'non-sso') return { requireSso: false }
  return {}
}
