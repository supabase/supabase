import { useProfile } from 'lib/profile'
import { useProfileIdentitiesQuery } from 'data/profile/profile-identities-query'

export function useProfileNameAndPicture(): {
  username: string | undefined
  avatarUrl: string | undefined
} {
  const { profile } = useProfile()
  const username = profile?.username

  const { data: identitiesData } = useProfileIdentitiesQuery()
  const githubProfileData = identitiesData?.identities?.find(
    (x) => x.provider === 'github'
  )?.identity_data
  const avatarUrl = githubProfileData?.avatar_url

  return { username, avatarUrl }
}
