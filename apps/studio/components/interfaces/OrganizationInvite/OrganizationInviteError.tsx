import { useRouter } from 'next/router'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns'

import { OrganizationInviteByToken } from '@/data/organization-members/organization-invitation-token-query'
import { useSignOut } from '@/lib/auth'
import { useProfile } from '@/lib/profile'
import type { ResponseError } from '@/types'

interface OrganizationInviteError {
  data?: OrganizationInviteByToken
  error?: ResponseError | null
  isError: boolean
  isInvalidInvite?: boolean
}

export const OrganizationInviteError = ({
  data,
  error,
  isError,
  isInvalidInvite,
}: OrganizationInviteError) => {
  const router = useRouter()
  const signOut = useSignOut()
  const { profile } = useProfile()

  const handleSignOut = async () => {
    await signOut()
    router.reload()
  }

  if (isInvalidInvite) {
    return (
      <Admonition
        type="warning"
        description="Open the full invite link again, or ask the organization owner for a new invite."
      />
    )
  }

  if (isError) {
    return (
      <Admonition
        type="danger"
        description={error?.message ?? 'Open the full invite link again, or ask for a new invite.'}
      />
    )
  }

  if (!data?.email_match) {
    return (
      <div className="flex flex-col gap-3">
        <Admonition
          type="warning"
          description={
            profile?.primary_email ? (
              <>
                You are signed in as{' '}
                <span className="font-medium text-foreground">{profile.primary_email}</span>. Sign
                in with the email address that received this invite.
              </>
            ) : (
              'Sign in with the email address that received this invite.'
            )
          }
        />
        <Button type="default" block onClick={handleSignOut}>
          Sign out
        </Button>
      </div>
    )
  }

  if (data.expired_token) {
    return (
      <Admonition
        type="warning"
        description="Ask the organization owner to send you a new invite."
      />
    )
  }

  return (
    <Admonition
      type="warning"
      description="Open the full invite link again, or ask the organization owner for a new invite."
    />
  )
}
