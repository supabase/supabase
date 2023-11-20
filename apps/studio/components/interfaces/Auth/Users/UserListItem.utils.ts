import { User } from 'data/auth/users-query'

export function getDisplayName(user: User, fallback = '-') {
  const {
    displayName,
    display_name,
    fullName,
    full_name,
    familyName,
    family_name,
    givenName,
    given_name,
    surname,
    lastName,
    last_name,
    firstName,
    first_name,
  } = user.raw_user_meta_data ?? {}

  const last = familyName || family_name || surname || lastName || last_name
  const first = givenName || given_name || firstName || first_name

  return (
    displayName ||
    display_name ||
    fullName ||
    full_name ||
    (first && last && `${first} ${last}`) ||
    fallback
  )
}
