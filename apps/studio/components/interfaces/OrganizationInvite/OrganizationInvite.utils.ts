import type { OrganizationInviteByToken } from '@/data/organization-members/organization-invitation-token-query'
import type { ResponseError } from '@/types'

type OrganizationInviteStatusVariables = {
  data?: OrganizationInviteByToken
  error?: ResponseError | null
  isErrorInvitation: boolean
  isLoadingInvitation: boolean
  isLoadingProfile: boolean
  isLoggedIn: boolean
  isRouterReady: boolean
  isSuccessInvitation: boolean
  profileExists: boolean
}

type OrganizationInviteContentVariables = {
  data?: OrganizationInviteByToken
  isSignUpEnabled: boolean
  status: OrganizationInviteStatus
}

export type OrganizationInviteStatus =
  | 'signed-out'
  | 'loading'
  | 'ready'
  | 'wrong-account'
  | 'expired'
  | 'invalid'
  | 'no-longer-valid'
  | 'error'

export function getOrganizationInviteStatus({
  data,
  error,
  isErrorInvitation,
  isLoadingInvitation,
  isLoadingProfile,
  isLoggedIn,
  isRouterReady,
  isSuccessInvitation,
  profileExists,
}: OrganizationInviteStatusVariables): OrganizationInviteStatus {
  const isSignedOut = !isLoggedIn || (!profileExists && !isLoadingProfile)

  if (isSignedOut) return 'signed-out'
  if (isLoadingProfile || isLoadingInvitation || !isRouterReady) return 'loading'

  if (error?.code === 401 && error?.message.includes('Failed to retrieve organization')) {
    return 'no-longer-valid'
  }

  if (
    (isSuccessInvitation && !!data?.token_does_not_exist) ||
    (isErrorInvitation && error?.code === 404)
  ) {
    return 'invalid'
  }

  if (isErrorInvitation) return 'error'
  if (isSuccessInvitation && !!data?.expired_token) return 'expired'
  if (isSuccessInvitation && !!data && !data.email_match) return 'wrong-account'

  return 'ready'
}

export function getOrganizationInviteContent({
  data,
  isSignUpEnabled,
  status,
}: OrganizationInviteContentVariables) {
  const signedOutDescription = `Sign in${
    isSignUpEnabled ? ' or create an account' : ''
  } to view this invitation`

  if (status === 'signed-out') {
    return {
      title: 'View invitation',
      description: signedOutDescription,
    }
  }

  if (status === 'ready') {
    return {
      title: `Join ${data?.organization_name ?? 'an organization'}`,
      description: 'You have been invited to join this Supabase organization',
    }
  }

  if (status === 'wrong-account') return { title: 'Wrong account' }
  if (status === 'expired') return { title: 'Invite expired' }
  if (status === 'invalid') return { title: 'Invite invalid' }
  if (status === 'no-longer-valid') return { title: 'Invite no longer available' }
  if (status === 'error') return { title: 'Unable to load invitation' }

  return {}
}
