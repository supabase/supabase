import { useIsLoggedIn, useParams } from 'common'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Button, Card, CardContent } from 'ui'
import { Admonition, ShimmeringLoader } from 'ui-patterns'

import { OrganizationInviteError } from './OrganizationInviteError'
import {
  getOrganizationInviteContent,
  getOrganizationInviteStatus,
} from './OrganizationInvite.utils'
import {
  ConnectMockMenu,
  ConnectPreviewToolbar,
  isTemporaryConnectMockPreviewEnabled,
} from '@/components/interfaces/Connect/ConnectMockMenu'
import {
  InterstitialAccountRow,
  InterstitialLayout,
  SupabaseLogo,
} from '@/components/layouts/InterstitialLayout'
import { useOrganizationAcceptInvitationMutation } from '@/data/organization-members/organization-invitation-accept-mutation'
import {
  useOrganizationInvitationTokenQuery,
  type OrganizationInviteByToken,
} from '@/data/organization-members/organization-invitation-token-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useProfile, useProfileNameAndPicture } from '@/lib/profile'
import { ResponseError } from '@/types'

type MockState =
  | 'signed-out'
  | 'signed-out-no-sign-up'
  | 'loading'
  | 'ready'
  | 'joining'
  | 'wrong-account'
  | 'expired'
  | 'invalid'
  | 'no-longer-valid'
  | 'error'

type MockProfile = {
  username?: string
  primaryEmail?: string
  avatarUrl?: string
}

type MockConfig = {
  isLoggedIn: boolean
  isSignUpEnabled?: boolean
  isLoadingProfile?: boolean
  profile?: MockProfile
  invitationState?: 'loading' | 'success' | 'error'
  invitationData?: OrganizationInviteByToken
  invitationError?: ResponseError
  isJoining?: boolean
}

const MOCK_PROFILE: MockProfile = {
  username: 'jane',
  primaryEmail: 'jane@acmecorp.io',
}

const WRONG_ACCOUNT_PROFILE: MockProfile = {
  username: 'jane',
  primaryEmail: 'jane@personal.dev',
}

// ---------------------------------------------------------------------------
// Mock data — design review only
// Navigate to /join?mock=<state> to preview each invite UI branch locally.
// ---------------------------------------------------------------------------
const READY_INVITE: OrganizationInviteByToken = {
  authorized_user: true,
  email_match: true,
  expired_token: false,
  invite_id: 42,
  organization_name: 'Acme Corp',
  sso_mismatch: false,
  token_does_not_exist: false,
}

const INVITE_MOCKS: Record<MockState, MockConfig> = {
  'signed-out': {
    isLoggedIn: false,
    isSignUpEnabled: true,
  },
  'signed-out-no-sign-up': {
    isLoggedIn: false,
    isSignUpEnabled: false,
  },
  loading: {
    isLoggedIn: true,
    profile: MOCK_PROFILE,
    invitationState: 'loading',
  },
  ready: {
    isLoggedIn: true,
    profile: MOCK_PROFILE,
    invitationState: 'success',
    invitationData: READY_INVITE,
  },
  joining: {
    isLoggedIn: true,
    profile: MOCK_PROFILE,
    invitationState: 'success',
    invitationData: READY_INVITE,
    isJoining: true,
  },
  'wrong-account': {
    isLoggedIn: true,
    profile: WRONG_ACCOUNT_PROFILE,
    invitationState: 'success',
    invitationData: {
      ...READY_INVITE,
      email_match: false,
    },
  },
  expired: {
    isLoggedIn: true,
    profile: MOCK_PROFILE,
    invitationState: 'success',
    invitationData: {
      ...READY_INVITE,
      expired_token: true,
    },
  },
  invalid: {
    isLoggedIn: true,
    profile: MOCK_PROFILE,
    invitationState: 'success',
    invitationData: {
      ...READY_INVITE,
      token_does_not_exist: true,
    },
  },
  'no-longer-valid': {
    isLoggedIn: true,
    profile: MOCK_PROFILE,
    invitationState: 'error',
    invitationError: new ResponseError('Failed to retrieve organization', 401),
  },
  error: {
    isLoggedIn: true,
    profile: MOCK_PROFILE,
    invitationState: 'error',
    invitationError: new ResponseError('Failed to retrieve token', 500),
  },
}

const getMockState = (value: unknown): MockState | undefined => {
  return typeof value === 'string' && value in INVITE_MOCKS ? (value as MockState) : undefined
}

const ORGANIZATION_INVITE_MOCK_STATES = Object.keys(INVITE_MOCKS) as MockState[]

export const OrganizationInvite = () => {
  const router = useRouter()
  const isLoggedIn = useIsLoggedIn()
  const { profile, isLoading: isLoadingProfile } = useProfile()
  const { username, avatarUrl, primaryEmail } = useProfileNameAndPicture()
  const { slug, token } = useParams()

  const isSignUpEnabled = useIsFeatureEnabled('dashboard_auth:sign_up')
  const [hasMounted, setHasMounted] = useState(false)
  const [mockJoining, setMockJoining] = useState(false)

  const mockParamFromQuery = getMockState(router.query.mock)
  const isMockMode =
    isTemporaryConnectMockPreviewEnabled() && hasMounted && router.isReady && !!mockParamFromQuery
  const mockParam = isMockMode ? mockParamFromQuery : undefined
  const mockConfig = mockParam ? INVITE_MOCKS[mockParam] : undefined

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    setMockJoining(false)
  }, [mockParam])

  const {
    data,
    error,
    isSuccess: isSuccessInvitation,
    isError: isErrorInvitation,
    isPending: isLoadingInvitation,
  } = useOrganizationInvitationTokenQuery(
    { slug, token },
    {
      retry: false,
      refetchOnWindowFocus: false,
      enabled: !!profile && !isMockMode && !!slug && !!token,
    }
  )
  const effectiveIsLoggedIn = isMockMode ? (mockConfig?.isLoggedIn ?? false) : isLoggedIn
  const effectiveProfile = isMockMode ? mockConfig?.profile : profile
  const effectiveIsLoadingProfile = isMockMode
    ? (mockConfig?.isLoadingProfile ?? false)
    : isLoadingProfile
  const effectiveUsername = isMockMode ? mockConfig?.profile?.username : username
  const effectiveAvatarUrl = isMockMode ? mockConfig?.profile?.avatarUrl : avatarUrl
  const effectivePrimaryEmail = isMockMode ? mockConfig?.profile?.primaryEmail : primaryEmail
  const effectiveIsSignUpEnabled = isMockMode
    ? (mockConfig?.isSignUpEnabled ?? true)
    : isSignUpEnabled

  const effectiveData =
    isMockMode && mockConfig?.invitationState === 'success' ? mockConfig.invitationData : data
  const effectiveError =
    isMockMode && mockConfig?.invitationState === 'error' ? mockConfig.invitationError : error
  const effectiveIsSuccessInvitation = isMockMode
    ? mockConfig?.invitationState === 'success'
    : isSuccessInvitation
  const effectiveIsErrorInvitation = isMockMode
    ? mockConfig?.invitationState === 'error'
    : isErrorInvitation
  const effectiveIsLoadingInvitation = isMockMode
    ? mockConfig?.invitationState === 'loading'
    : !router.isReady || isLoadingInvitation
  const inviteStatus = getOrganizationInviteStatus({
    data: effectiveData,
    error: effectiveError,
    isErrorInvitation: effectiveIsErrorInvitation,
    isLoadingInvitation: effectiveIsLoadingInvitation,
    isLoadingProfile: effectiveIsLoadingProfile,
    isLoggedIn: effectiveIsLoggedIn,
    isRouterReady: router.isReady,
    isSuccessInvitation: effectiveIsSuccessInvitation,
    profileExists: !!effectiveProfile,
  })
  const isSignedOut = inviteStatus === 'signed-out'
  const isInvitationLoading = inviteStatus === 'loading'
  const inviteContent = getOrganizationInviteContent({
    data: effectiveData,
    isSignUpEnabled: effectiveIsSignUpEnabled,
    status: inviteStatus,
  })
  const effectiveHasError = ['wrong-account', 'expired', 'invalid', 'error'].includes(inviteStatus)
  const invitationPath = isMockMode
    ? `/join?mock=${mockParam}`
    : `/join?token=${token}&slug=${slug}`
  const loginRedirectLink = `/sign-in?returnTo=${encodeURIComponent(invitationPath)}`
  const signupRedirectLink = `/sign-up?returnTo=${encodeURIComponent(invitationPath)}`

  const { mutate: joinOrganization, isPending: isJoining } =
    useOrganizationAcceptInvitationMutation({
      onSuccess: () => {
        router.push('/organizations')
      },
      onError: (error) => {
        toast.error(`Failed to join organization: ${error.message}`)
      },
    })

  const replaceMockState = (value: MockState) => {
    router.replace(
      { pathname: router.pathname, query: { ...router.query, mock: value } },
      undefined,
      { shallow: true }
    )
  }

  async function handleJoinOrganization() {
    if (isMockMode) {
      setMockJoining(true)
      return
    }
    if (!slug) return console.error('Slug is required')
    if (!token) return console.error('Token is required')
    joinOrganization({ slug, token })
  }

  const effectiveIsJoining = isMockMode ? mockConfig?.isJoining || mockJoining : isJoining
  const displayName = effectivePrimaryEmail ?? effectiveUsername ?? ''
  const mockSwitcher =
    isMockMode && mockParam ? (
      <ConnectPreviewToolbar>
        <ConnectMockMenu
          state={mockParam}
          states={ORGANIZATION_INVITE_MOCK_STATES}
          onSelect={replaceMockState}
        />
      </ConnectPreviewToolbar>
    ) : null

  const withMockSwitcher = (children: ReactNode) => (
    <>
      {mockSwitcher}
      <InterstitialLayout
        logo={<SupabaseLogo />}
        title={
          isInvitationLoading ? (
            <ShimmeringLoader className="mx-auto h-7 w-36 max-w-full py-0" />
          ) : inviteContent.title ? (
            inviteContent.title
          ) : undefined
        }
        description={
          isInvitationLoading ? (
            <ShimmeringLoader className="mx-auto h-4 w-48 max-w-full py-0" />
          ) : inviteContent.description ? (
            inviteContent.description
          ) : undefined
        }
        subtitle={
          isInvitationLoading ? (
            <ShimmeringLoader className="mx-auto h-5 w-24 max-w-full rounded-full py-0" />
          ) : undefined
        }
        titleClassName="text-xl"
        subtitleClassName="leading-none"
      >
        <div className="px-6 pb-6">{children}</div>
      </InterstitialLayout>
    </>
  )

  if (isSignedOut) {
    return withMockSwitcher(
      <div className="flex flex-col gap-2">
        <Button asChild type="primary" block>
          <Link href={loginRedirectLink}>Sign in</Link>
        </Button>
        {effectiveIsSignUpEnabled && (
          <Button asChild type="default" block>
            <Link href={signupRedirectLink}>Create an account</Link>
          </Button>
        )}
      </div>
    )
  }

  if (isInvitationLoading) {
    return withMockSwitcher(
      <div className="flex flex-col gap-6">
        <Card className="shadow-none">
          <CardContent className="flex items-center gap-3 border-none px-4 py-3">
            <ShimmeringLoader className="size-8 flex-shrink-0 rounded-full py-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <ShimmeringLoader className="h-3 w-20 py-0" />
              <ShimmeringLoader className="h-4 w-40 max-w-full py-0" />
            </div>
          </CardContent>
        </Card>
        <div className="flex flex-col gap-2">
          <ShimmeringLoader className="h-10 w-full py-0" />
          <ShimmeringLoader className="h-10 w-full py-0" />
        </div>
      </div>
    )
  }

  if (inviteStatus === 'no-longer-valid') {
    return withMockSwitcher(
      <div className="flex flex-col gap-3">
        <Admonition
          type="warning"
          description="This invite has already been accepted or declined."
        />
        <Button type="default" block asChild>
          <Link href="/">Back to dashboard</Link>
        </Button>
      </div>
    )
  }

  if (effectiveHasError) {
    return withMockSwitcher(
      <OrganizationInviteError
        data={effectiveData}
        error={effectiveError}
        isError={effectiveIsErrorInvitation}
        isInvalidInvite={inviteStatus === 'invalid'}
        profileEmail={effectivePrimaryEmail}
        onSignOut={
          isMockMode
            ? async () => {
                replaceMockState('signed-out')
              }
            : undefined
        }
      />
    )
  }

  return withMockSwitcher(
    <div className="flex flex-col gap-6">
      <InterstitialAccountRow avatarUrl={effectiveAvatarUrl} displayName={displayName} />

      <div className="flex flex-col gap-2">
        <Button
          type="primary"
          block
          loading={effectiveIsJoining}
          disabled={effectiveIsJoining}
          onClick={handleJoinOrganization}
        >
          Accept invite
        </Button>
        <Button asChild type="text" block>
          <Link href="/projects">Decline</Link>
        </Button>
      </div>
    </div>
  )
}
