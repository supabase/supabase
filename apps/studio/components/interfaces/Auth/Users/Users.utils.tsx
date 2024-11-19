import dayjs from 'dayjs'
import { UserIcon } from 'lucide-react'
import { UIEvent } from 'react'
import { Column } from 'react-data-grid'

import { User } from 'data/auth/users-infinite-query'
import { BASE_PATH } from 'lib/constants'
import { cn } from 'ui'
import { HeaderCell } from './UsersGridComponents'
import { ColumnConfiguration, USERS_TABLE_COLUMNS } from './UsersV2'

const SUPPORTED_CSP_AVATAR_URLS = [
  'https://avatars.githubusercontent.com',
  'https://lh3.googleusercontent.com',
]

export const isAtBottom = ({ currentTarget }: UIEvent<HTMLDivElement>): boolean => {
  return currentTarget.scrollTop + 10 >= currentTarget.scrollHeight - currentTarget.clientHeight
}

export const formatUsersData = (users: User[]) => {
  return users.map((user) => {
    const provider: string = user.raw_app_meta_data?.provider ?? ''
    const providers: string[] = (user.raw_app_meta_data?.providers ?? []).map((x: string) => {
      if (x.startsWith('sso')) return 'SAML'
      return x
    })

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      providers: user.is_anonymous ? '-' : providers,
      provider_icons: providers
        .map((p) => {
          return p === 'email'
            ? `${BASE_PATH}/img/icons/email-icon2.svg`
            : p === 'SAML'
              ? `${BASE_PATH}/img/icons/saml-icon.svg`
              : providerIconMap[p]
                ? `${BASE_PATH}/img/icons/${providerIconMap[p]}.svg`
                : undefined
        })
        .filter(Boolean),
      // I think it's alright to just check via the main provider since email and phone should be mutually exclusive
      provider_type: user.is_anonymous
        ? 'Anonymous'
        : provider === 'email'
          ? '-'
          : socialProviders.includes(provider)
            ? 'Social'
            : phoneProviders.includes(provider)
              ? 'Phone'
              : '-',
      // [Joshen] Note that the images might not load due to CSP issues
      img: getAvatarUrl(user),
      name: getDisplayName(user),
    }
  })
}

const providers = {
  social: [
    { email: 'email-icon2' },
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
export const providerIconMap: { [key: string]: string } = Object.values([
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

function toPrettyJsonString(value: unknown): string | undefined {
  if (!value) return undefined
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map((item) => toPrettyJsonString(item)).join(' ')

  try {
    return JSON.stringify(value)
  } catch (error) {
    // ignore the error
  }

  return undefined
}

export function getDisplayName(user: User, fallback = '-'): string {
  const {
    custom_claims,
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

  const {
    displayName: ccDisplayName,
    display_name: cc_display_name,
    fullName: ccFullName,
    full_name: cc_full_name,
    familyName: ccFamilyName,
    family_name: cc_family_name,
    givenName: ccGivenName,
    given_name: cc_given_name,
    surname: ccSurname,
    lastName: ccLastName,
    last_name: cc_last_name,
    firstName: ccFirstName,
    first_name: cc_first_name,
  } = custom_claims ?? {}

  const last = toPrettyJsonString(
    familyName ||
      family_name ||
      surname ||
      lastName ||
      last_name ||
      ccFamilyName ||
      cc_family_name ||
      ccSurname ||
      ccLastName ||
      cc_last_name
  )

  const first = toPrettyJsonString(
    givenName ||
      given_name ||
      firstName ||
      first_name ||
      ccGivenName ||
      cc_given_name ||
      ccFirstName ||
      cc_first_name
  )

  return (
    toPrettyJsonString(
      displayName ||
        display_name ||
        ccDisplayName ||
        cc_display_name ||
        fullName ||
        full_name ||
        ccFullName ||
        cc_full_name ||
        (first && last && `${first} ${last}`) ||
        last ||
        first
    ) || fallback
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

  const url = (avatarUrl ||
    avatarURL ||
    avatar_url ||
    profileImage ||
    profile_image ||
    profileUrl ||
    profileURL ||
    profile_url ||
    profileImageUrl ||
    profileImageURL ||
    profile_image_url ||
    '') as unknown

  if (typeof url !== 'string') return undefined
  const isSupported = SUPPORTED_CSP_AVATAR_URLS.some((x) => url.startsWith(x))
  return isSupported ? url : undefined
}

export const formatUserColumns = ({
  config,
  users,
  visibleColumns = [],
  setSortByValue,
}: {
  config: ColumnConfiguration[]
  users: User[]
  visibleColumns?: string[]
  setSortByValue: (val: string) => void
}) => {
  const columnOrder = config.map((c) => c.id) ?? USERS_TABLE_COLUMNS.map((c) => c.id)

  let gridColumns = USERS_TABLE_COLUMNS.map((col) => {
    const savedConfig = config.find((c) => c.id === col.id)
    const res: Column<any> = {
      key: col.id,
      name: col.name,
      resizable: col.resizable ?? true,
      sortable: false,
      draggable: true,
      width: savedConfig?.width ?? col.width,
      minWidth: col.minWidth ?? 120,
      headerCellClass: 'z-50 outline-none !shadow-none',
      renderHeaderCell: () => {
        if (col.id === 'img') return undefined
        return <HeaderCell col={col} setSortByValue={setSortByValue} />
      },
      renderCell: ({ row }) => {
        const value = row?.[col.id]
        const user = users?.find((u) => u.id === row.id)
        const formattedValue =
          value !== null && ['created_at', 'last_sign_in_at'].includes(col.id)
            ? dayjs(value).format('ddd DD MMM YYYY HH:mm:ss [GMT]ZZ')
            : Array.isArray(value)
              ? value.join(', ')
              : value
        const isConfirmed = !!user?.confirmed_at

        if (col.id === 'img') {
          return (
            <div className="flex items-center justify-center">
              <div
                className={cn(
                  'flex items-center justify-center w-6 h-6 rounded-full bg-center bg-cover bg-no-repeat',
                  !row.img ? 'bg-selection' : 'border'
                )}
                style={{ backgroundImage: row.img ? `url('${row.img}')` : 'none' }}
              >
                {!row.img && <UserIcon size={12} />}
              </div>
            </div>
          )
        }

        return (
          <div
            className={cn(
              'w-full flex items-center text-xs',
              col.id.includes('provider') ? 'capitalize' : ''
            )}
          >
            {/* [Joshen] Not convinced this is the ideal way to display the icons, but for now */}
            {col.id === 'providers' &&
              row.provider_icons.map((icon: string, idx: number) => {
                const provider = row.providers[idx]
                return (
                  <div
                    className="min-w-6 min-h-6 rounded-full border flex items-center justify-center bg-surface-75"
                    style={{
                      marginLeft: idx === 0 ? 0 : `-8px`,
                      zIndex: row.provider_icons.length - idx,
                    }}
                  >
                    <img
                      key={`${user?.id}-${provider}`}
                      width={16}
                      src={icon}
                      alt={`${provider} auth icon`}
                      className={cn(provider === 'github' && 'dark:invert')}
                    />
                  </div>
                )
              })}
            {col.id === 'last_sign_in_at' && !isConfirmed ? (
              <p className="text-foreground-lighter">Waiting for verification</p>
            ) : (
              <p className={cn(col.id === 'providers' && 'ml-1')}>
                {formattedValue === null ? '-' : formattedValue}
              </p>
            )}
          </div>
        )
      },
    }
    return res
  })

  const profileImageColumn = gridColumns.find((col) => col.key === 'img')

  if (columnOrder.length > 0) {
    gridColumns = gridColumns
      .filter((col) => columnOrder.includes(col.key))
      .sort((a: any, b: any) => {
        return columnOrder.indexOf(a.key) - columnOrder.indexOf(b.key)
      })
  }

  return visibleColumns.length === 0
    ? gridColumns
    : ([profileImageColumn].concat(
        gridColumns.filter((col) => visibleColumns.includes(col.key))
      ) as Column<any>[])
}
