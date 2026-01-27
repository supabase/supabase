import type { AccessArgs, FieldAccess } from 'payload'

import type { User } from '../payload-types'

type isAdmin = (args: AccessArgs<User>) => boolean

export const isAdmin: isAdmin = ({ req: { user } }) => {
  // Return true or false based on if the user has an admin role
  return Boolean(user?.roles?.includes('admin'))
}

export const isAdminFieldLevel: FieldAccess<{ id: string }, User> = ({ req: { user } }) => {
  // Return true or false based on if the user has an admin role
  return Boolean(user?.roles?.includes('admin'))
}
