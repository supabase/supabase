import { getDisplayName } from './Users.utils'
import type { User } from '@/data/auth/users-infinite-query'

export function getUserPrimaryLabel(user: User): string {
  if (user.is_anonymous) return 'Anonymous user'
  return getDisplayName(user, '') || user.email || user.phone || user.id || 'Unknown user'
}

export function getUserInitials(user: User): string {
  const displayName = getDisplayName(user, '').trim()
  if (displayName) {
    const words = displayName.trim().split(/\s+/).filter(Boolean)
    const initials = words.length > 1 ? words[0][0] + words[words.length - 1][0] : words[0][0]
    return initials.toUpperCase()
  }
  const first = user.email?.trim()[0]
  return first ? first.toUpperCase() : ''
}
