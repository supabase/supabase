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

  return (
    displayName ||
    display_name ||
    fullName ||
    full_name ||
    (familyName && givenName && `${givenName} ${familyName}`) ||
    (family_name && given_name && `${given_name} ${family_name}`) ||
    (surname && firstName && `${firstName} ${surname}`) ||
    (surname && first_name && `${first_name} ${surname}`) ||
    (lastName && firstName && `${firstName} ${lastName}`) ||
    (last_name && first_name && `${first_name} ${last_name}`) ||
    (lastName && givenName && `${givenName} ${lastName}`) ||
    (last_name && given_name && `${given_name} ${last_name}`) ||
    (surname && givenName && `${givenName} ${surname}`) ||
    (surname && given_name && `${given_name} ${surname}`) ||
    (lastName && given_name && `${given_name} ${lastName}`) ||
    (last_name && givenName && `${givenName} ${last_name}`) ||
    fallback
  )
}
