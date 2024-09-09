import { UIEvent } from 'react'

import { User } from 'data/auth/users-query'
import { BASE_PATH } from 'lib/constants'

export const isAtBottom = ({ currentTarget }: UIEvent<HTMLDivElement>): boolean => {
  return currentTarget.scrollTop + 10 >= currentTarget.scrollHeight - currentTarget.clientHeight
}

export const formatUsersData = (users: User[]) => {
  return users.map((user) => {
    const provider: string = user.raw_app_meta_data?.provider ?? ''

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      provider: user.is_anonymous ? '-' : provider,
      provider_type: user.is_anonymous
        ? 'Anonymous'
        : socialProviders.includes(provider)
          ? 'Social'
          : phoneProviders.includes(provider)
            ? 'Phone'
            : '-',
      provider_icon:
        provider === 'email'
          ? `${BASE_PATH}/img/icons/email-icon2.svg`
          : providerIconMap[provider]
            ? `${BASE_PATH}/img/icons/${providerIconMap[provider]}.svg`
            : undefined,
      img: getAvatarUrl(user), // [Joshen] Note that the images might not load due to CSP issues
      name: getDisplayName(user),
    }
  })
}

const providers = {
  social: [
    // { email: 'email-icon2' },
    { apple: 'apple-icon' },
    { azure: 'microsoft-icon' },
    { bitbucket: 'bitbucket-icon' },
    { discord: 'discord-icon' },
    { facebook: 'facebook-icon' },
    { figma: 'figma-icon' },
    { github: 'github-icon' },
    { gitlab: 'gitlab-icon' },
    { google: 'google-icon' },
    { kakao: 'kakao-icon' },
    { keycloak: 'keycloak-icon' },
    { linkedin: 'linkedin-icon' },
    { notion: 'notion-icon' },
    { twitch: 'twitch-icon' },
    { twitter: 'twitter-icon' },
    { slack: 'slack-icon' },
    { spotify: 'spotify-icon' },
    { workos: 'workos-icon' },
    { zoom: 'zoom-icon' },
  ],
  phone: [
    { twilio: 'twilio-icon' },
    { messagebird: 'messagebird-icon' },
    { textlocal: 'messagebird-icon' },
    { vonage: 'messagebird-icon' },
    { twilioverify: 'twilio-verify-icon' },
  ],
}

// [Joshen] Just FYI this is not stress tested as I'm not sure what
// all the potential values for each provider is under user.raw_app_meta_data.provider
// Will need to go through one by one to properly verify https://supabase.com/docs/guides/auth/social-login
// But I've made the UI handle to not render any icon if nothing matches in this map
const providerIconMap: { [key: string]: string } = Object.values([
  ...providers.social,
  ...providers.phone,
]).reduce((a, b) => {
  const [[key, value]] = Object.entries(b)
  return { ...a, [key]: value }
}, {})

const socialProviders = providers.social.map((x) => {
  const [key] = Object.keys(x)
  return key
})

const phoneProviders = providers.phone.map((x) => {
  const [key] = Object.keys(x)
  return key
})

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
