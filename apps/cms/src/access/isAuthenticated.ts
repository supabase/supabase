import type { AccessArgs } from 'payload'

import type { User } from '../payload-types'

type isAuthenticated = (args: AccessArgs<User>) => boolean

export const isAuthenticated: isAuthenticated = ({ req: { user } }) => {
  return Boolean(user)
}
