import type { OrganizationMember } from 'data/organizations/organization-members-query'

// Invite is expired if older than 24hrs
export function isInviteExpired(timestamp: string) {
  const inviteDate = new Date(timestamp)
  const now = new Date()
  const timeBetween = now.valueOf() - inviteDate.valueOf()
  if (timeBetween / 1000 / 60 / 60 < 24) {
    return false
  }
  return true
}

export const getUserDisplayName = (user?: OrganizationMember) => {
  if (!user) return ''

  const { username, primary_email, invited_id } = user || {}
  return invited_id !== undefined ? primary_email : username || ''
}
