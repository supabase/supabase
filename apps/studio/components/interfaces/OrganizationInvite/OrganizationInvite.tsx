import { CheckSquare } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useOrganizationAcceptInvitationMutation } from 'data/organization-members/organization-invitation-accept-mutation'
import { useOrganizationInvitationTokenQuery } from 'data/organization-members/organization-invitation-token-query'
import { useProfile } from 'lib/profile'
import { Button, cn } from 'ui'
import { Admonition, GenericSkeletonLoader } from 'ui-patterns'
import { OrganizationInviteError } from './OrganizationInviteError'

export const OrganizationInvite = () => {
  const router = useRouter()
  const { profile } = useProfile()
  const { slug, token } = useParams()

  const {
    data,
    error,
    isSuccess: isSuccessInvitation,
    isError: isErrorInvitation,
    isLoading: isLoadingInvitation,
  } = useOrganizationInvitationTokenQuery(
    { slug, token },
    {
      retry: false,
      refetchOnWindowFocus: false,
      enabled: !!profile,
    }
  )
  const hasError =
    isErrorInvitation ||
    (isSuccessInvitation && (data.token_does_not_exist || data.expired_token || !data.email_match))
  const inviteIsNoLongerValid =
    error?.code === 401 && error?.message.includes('Failed to retrieve organization')

  const organizationName = isSuccessInvitation ? data?.organization_name : 'An organization'
  const loginRedirectLink = `/sign-in?returnTo=${encodeURIComponent(`/join?token=${token}&slug=${slug}`)}`

  const { mutate: joinOrganization, isLoading: isJoining } =
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

  return (
    <div
      className={cn(
        'mx-auto overflow-hidden rounded-md border',
        'border-muted bg-alternative text-center shadow',
        'md:w-[400px]'
      )}
    >
      {!profile ? (
        <>
          <Admonition
            showIcon={false}
            type="default"
            title="Sign in or create an account first to view this invitation"
            className="mb-0 border-0 rounded-none text-left"
          />
          <div className="p-4 border-muted border-t flex gap-x-3 justify-center">
            <Button asChild type="default">
              <Link href={loginRedirectLink}>Sign in</Link>
            </Button>
            <Button asChild type="default">
              <Link href={loginRedirectLink}>Create an account</Link>
            </Button>
          </div>
        </>
      ) : isLoadingInvitation ? (
        <div className="p-5">
          <GenericSkeletonLoader />
        </div>
      ) : inviteIsNoLongerValid ? (
        <>
          <Admonition
            type="default"
            title="Invalid invitation"
            description="This organization invite is no longer valid as it has either been accepted or declined"
            className="mb-0 border-0 rounded-none text-left"
          />
          <div className="p-4 border-muted border-t">
            <Button type="default" asChild>
              <Link href="/">Back to dashboard</Link>
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-y-1 px-6 py-6">
            <p className="text-sm text-foreground-light">You have been invited to join </p>
            <p className="text-foreground text-2xl">{organizationName}</p>
            {isSuccessInvitation && (
              <p className="text-xs text-foreground-lighter">{`Organization slug: ${slug}`}</p>
            )}
          </div>
          <div
            className={cn('border-t border-muted', hasError ? 'bg-alternative' : 'bg-transparent')}
          >
            <div
              className={cn(
                'flex flex-col gap-4',
                !isLoadingInvitation && !hasError && 'px-6 py-4'
              )}
            >
              {hasError && (
                <OrganizationInviteError data={data} error={error} isError={isErrorInvitation} />
              )}
              {isSuccessInvitation && !hasError && (
                <div className="flex flex-row items-center justify-center gap-3">
                  <Button type="default" disabled={isJoining} asChild>
                    <Link href="/projects">Decline</Link>
                  </Button>
                  <Button
                    type="primary"
                    loading={isJoining}
                    disabled={isJoining}
                    onClick={handleJoinOrganization}
                    icon={<CheckSquare />}
                  >
                    Join organization
                  </Button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
