import { useIsLoggedIn, useParams } from 'common'
import Link from 'next/link'
import { useRouter } from 'next/router'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { Button, Card, CardContent } from 'ui'
import { Admonition, ShimmeringLoader } from 'ui-patterns'

import {
  getOrganizationInviteContent,
  getOrganizationInviteStatus,
} from './OrganizationInvite.utils'
import { OrganizationInviteError } from './OrganizationInviteError'
import {
  InterstitialAccountRow,
  InterstitialLayout,
  SupabaseLogo,
} from '@/components/layouts/InterstitialLayout'
import { useOrganizationAcceptInvitationMutation } from '@/data/organization-members/organization-invitation-accept-mutation'
import { useOrganizationInvitationTokenQuery } from '@/data/organization-members/organization-invitation-token-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useProfile, useProfileNameAndPicture } from '@/lib/profile'

export const OrganizationInvite = () => {
  const router = useRouter()
  const isLoggedIn = useIsLoggedIn()
  const { profile, isLoading: isLoadingProfile } = useProfile()
  const { username, avatarUrl, primaryEmail } = useProfileNameAndPicture()
  const { slug, token } = useParams()

  const isSignUpEnabled = useIsFeatureEnabled('dashboard_auth:sign_up')

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
      enabled: !!profile && !!slug && !!token,
    }
  )
  const inviteStatus = getOrganizationInviteStatus({
    data,
    error,
    isErrorInvitation,
    isLoadingInvitation,
    isLoadingProfile,
    isLoggedIn,
    isRouterReady: router.isReady,
    isSuccessInvitation,
    profileExists: !!profile,
  })
  const isSignedOut = inviteStatus === 'signed-out'
  const isInvitationLoading = inviteStatus === 'loading'
  const inviteContent = getOrganizationInviteContent({
    data,
    isSignUpEnabled,
    status: inviteStatus,
  })
  const hasError = ['wrong-account', 'expired', 'invalid', 'error'].includes(inviteStatus)
  const loginRedirectLink = `/sign-in?returnTo=${encodeURIComponent(`/join?token=${token}&slug=${slug}`)}`
  const signupRedirectLink = `/sign-up?returnTo=${encodeURIComponent(`/join?token=${token}&slug=${slug}`)}`

  const { mutate: joinOrganization, isPending: isJoining } =
    useOrganizationAcceptInvitationMutation({
      onSuccess: () => {
        router.push('/organizations')
      },
      onError: (error) => {
        toast.error(`Failed to join organization: ${error.message}`)
      },
    })

  async function handleJoinOrganization() {
    if (!slug) return console.error('Slug is required')
    if (!token) return console.error('Token is required')
    joinOrganization({ slug, token })
  }

  const withLayout = (children: ReactNode) => (
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
      titleClassName="text-xl"
    >
      <div className="px-6 pb-6">{children}</div>
    </InterstitialLayout>
  )

  if (isSignedOut) {
    return withLayout(
      <div className="flex flex-col gap-2">
        <Button asChild type="primary" block>
          <Link href={loginRedirectLink}>Sign in</Link>
        </Button>
        {isSignUpEnabled && (
          <Button asChild type="default" block>
            <Link href={signupRedirectLink}>Create an account</Link>
          </Button>
        )}
      </div>
    )
  }

  if (isInvitationLoading) {
    return withLayout(
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
    return withLayout(
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

  if (hasError) {
    return withLayout(
      <OrganizationInviteError
        data={data}
        error={error}
        isError={isErrorInvitation}
        isInvalidInvite={inviteStatus === 'invalid'}
      />
    )
  }

  return withLayout(
    <div className="flex flex-col gap-6">
      <InterstitialAccountRow avatarUrl={avatarUrl} displayName={primaryEmail ?? username ?? ''} />

      <div className="flex flex-col gap-2">
        <Button
          type="primary"
          block
          loading={isJoining}
          disabled={isJoining}
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
