import { CheckSquare } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useOrganizationAcceptInvitationMutation } from 'data/organization-members/organization-invitation-accept-mutation'
import { useOrganizationInvitationTokenQuery } from 'data/organization-members/organization-invitation-token-query'
import { useProfile } from 'lib/profile'
import { ResponseError } from 'types'
import { Button, Loading, cn } from 'ui'
import { OrganizationInviteError } from './OrganizationInviteError'

export const OrganizationInvite = () => {
  const router = useRouter()
  const { profile } = useProfile()
  const { slug, token, name } = useParams()

  const { data, error, isSuccess, isError, isLoading } = useOrganizationInvitationTokenQuery(
    { slug, token },
    {
      retry: false,
      refetchOnWindowFocus: false,
    }
  )
  const hasError =
    isError || (isSuccess && (data.token_does_not_exist || data.expired_token || !data.email_match))

  const organizationName = data?.organization_name ?? name ?? 'an organization'
  const loginRedirectLink = `/sign-in?returnTo=${encodeURIComponent(`/join?token=${token}&slug=${slug}`)}`

  const { mutate: joinOrganization, isLoading: isJoining } =
    useOrganizationAcceptInvitationMutation({
      onSuccess: () => {
        router.push('/projects')
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
    <Loading active={profile !== undefined && isLoading}>
      <div className="flex flex-col gap-2 px-6 py-8">
        <p className="text-sm text-foreground">You have been invited to join </p>
        <p className="text-3xl text-foreground">{organizationName}</p>
        {slug && <p className="text-xs text-foreground-lighter">{`organization slug: ${slug}`}</p>}
      </div>

      <div className={cn('border-t border-muted', hasError ? 'bg-alternative' : 'bg-transparent')}>
        <div className={cn('flex flex-col gap-4', !isLoading && !hasError && 'px-6 py-4')}>
          {profile === undefined && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-foreground-lighter">
                You will need to sign in to accept this invitation
              </p>
              <div className="flex justify-center gap-3">
                <Button asChild type="default">
                  <Link href={loginRedirectLink}>Sign in</Link>
                </Button>
                <Button asChild type="default">
                  <Link href={loginRedirectLink}>Create an account</Link>
                </Button>
              </div>
            </div>
          )}
          {hasError && (
            <OrganizationInviteError
              data={data}
              error={error as unknown as ResponseError}
              isError={isError}
            />
          )}
          {isSuccess && !hasError && (
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
    </Loading>
  )
}
