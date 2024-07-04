import { useRouter } from 'next/router'

import AlertError from 'components/ui/AlertError'
import { OrganizationInviteByToken } from 'data/organization-members/organization-invitation-token-query'
import { useSignOut } from 'lib/auth'
import { useProfile } from 'lib/profile'
import { ResponseError } from 'types'
import { cn } from 'ui'

interface OrganizationInviteError {
  data?: OrganizationInviteByToken
  error?: ResponseError
  isError: boolean
}

export const OrganizationInviteError = ({ data, error, isError }: OrganizationInviteError) => {
  const router = useRouter()
  const signOut = useSignOut()
  const { profile } = useProfile()

  const hasError =
    isError || data?.token_does_not_exist || data?.expired_token || !data?.email_match

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-y-1 text-sm',
        hasError ? 'text-foreground-light' : 'text-foreground'
      )}
    >
      {isError ? (
        <AlertError
          error={error}
          subject="Failed to retrieve token"
          className="[&>h5]:text-left [&>div]:items-start rounded-t-none"
        />
      ) : data?.token_does_not_exist ? (
        <>
          <p>The invite token is invalid.</p>
          <p className="text-foreground-lighter">
            Try copying and pasting the link from the invite email, or ask the organization owner to
            invite you again.
          </p>
        </>
      ) : !data?.email_match ? (
        <>
          <p>
            Your email address {profile?.primary_email} does not match the email address this
            invitation was sent to.
          </p>
          <p className="text-foreground-lighter">
            To accept this invitation, you will need to{' '}
            <a
              className="cursor-pointer text-brand"
              onClick={async () => {
                await signOut()
                router.reload()
              }}
            >
              sign out
            </a>{' '}
            and then sign in or create a new account using the same email address used in the
            invitation.
          </p>
        </>
      ) : data.expired_token ? (
        <>
          <p>The invite token has expired.</p>
          <p className="text-foreground-lighter">
            Please request a new one from the organization owner.
          </p>
        </>
      ) : null}
    </div>
  )
}
