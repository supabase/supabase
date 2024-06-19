import type { User } from 'data/auth/users-query'

export function getDisplayName(user: User, fallback = '-'): string {
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

export function getAvatarUrl(user: User): string | undefined {
  const {
    avatarUrl,
    avatarURL,
    avatar_url,
    profileUrl,
    profileURL,
    profile_url,
    profileImage,
    profile_image,
    profileImageUrl,
    profileImageURL,
    profile_image_url,
  } = user.raw_user_meta_data ?? {}

  return (
    avatarUrl ||
    avatarURL ||
    avatar_url ||
    profileImage ||
    profile_image ||
    profileUrl ||
    profileURL ||
    profile_url ||
    profileImageUrl ||
    profileImageURL ||
    profile_image_url
  )
}
