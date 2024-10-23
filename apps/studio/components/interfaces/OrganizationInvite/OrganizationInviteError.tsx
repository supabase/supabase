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

  return (
    <div className={cn('flex flex-col items-center justify-center gap-y-1 text-sm')}>
      {isError ? (
        <AlertError
          error={error}
          subject="Failed to retrieve token"
          className="border-0 rounded-b [&>h5]:text-left [&>div]:items-start rounded-t-none"
        />
      ) : data?.token_does_not_exist ? (
        <div className="p-4 flex flex-col gap-y-1">
          <p>The invite token is invalid.</p>
          <p className="text-foreground-lighter">
            Try copying and pasting the link from the invite email, or ask the organization owner to
            invite you again.
          </p>
        </div>
      ) : !data?.email_match ? (
        <div className="p-4 flex flex-col gap-y-1">
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
        </div>
      ) : data.expired_token ? (
        <div className="p-4 flex flex-col gap-y-1">
          <p>The invite token has expired.</p>
          <p className="text-foreground-lighter">
            Please request a new one from the organization owner.
          </p>
        </div>
      ) : null}
    </div>
  )
}
