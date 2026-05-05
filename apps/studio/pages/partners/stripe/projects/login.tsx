import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { Button, LogoLoader } from 'ui'
import { Admonition } from 'ui-patterns'

import { APIAuthorizationLayout } from '@/components/layouts/APIAuthorizationLayout'
import { useConfirmAccountRequestMutation } from '@/data/partners/stripe-projects-confirm-mutation'
import { accountRequestQueryOptions } from '@/data/partners/stripe-projects-query'
import { withAuth } from '@/hooks/misc/withAuth'
import { useSignOut } from '@/lib/auth'
import { BASE_PATH } from '@/lib/constants'

const StripeIcon = () => (
  <img
    src={`${BASE_PATH}/img/icons/stripe-icon.svg`}
    alt="Stripe"
    width={40}
    height={40}
    className="mb-2"
  />
)

const StripeProjectsLoginPage = () => {
  const router = useRouter()
  const { ar_id } = useParams()

  const signOut = useSignOut()

  const {
    data: accountRequest,
    isPending: isQueryPending,
    isSuccess: isQuerySuccess,
    isError: isQueryError,
    error,
  } = useQuery({
    ...accountRequestQueryOptions({ arId: ar_id }),
    enabled: typeof ar_id !== 'undefined',
  })

  const {
    mutate: confirmAccountRequest,
    isPending: isConfirmationPending,
    isSuccess: isConfirmationSuccess,
  } = useConfirmAccountRequestMutation()

  useEffect(() => {
    if (!router.isReady) return

    if (!ar_id) {
      router.push('/404')
      return
    }
  }, [router.isReady, ar_id, router])

  const handleApprove = async () => {
    if (!ar_id || isConfirmationPending) return
    confirmAccountRequest({ arId: ar_id })
  }

  const isPending = isQueryPending
  const isSuccess = isQuerySuccess
  const isConfirmed = isConfirmationSuccess
  const isConfirming = isConfirmationPending
  const isError = isQueryError

  const linkedOrg = accountRequest?.linked_organization
  const emailMatches = accountRequest?.email_matches ?? false

  const loadingText = linkedOrg ? 'Authorizing...' : 'Creating organization...'
  const successTitle = linkedOrg ? 'Authorized' : 'Organization created'
  const successDescription = linkedOrg
    ? null
    : 'Your Supabase organization has been created and linked to your Stripe account.'

  return (
    <APIAuthorizationLayout HeadProvider={Head}>
      <div className="flex flex-col items-center min-h-[500px] max-w-[400px] mx-auto">
        {isConfirming ? (
          <>
            <LogoLoader />
            <p className="pt-4 text-foreground-light">{loadingText}</p>
          </>
        ) : isConfirmed ? (
          <>
            <StripeIcon />
            <h2 className="py-2 text-lg font-medium">{successTitle}</h2>
            <p className="text-sm text-center text-foreground-light">
              {successDescription && `${successDescription} `}
              You can close this window.
            </p>
          </>
        ) : isPending ? (
          <LogoLoader />
        ) : isSuccess ? (
          <>
            <StripeIcon />
            <h2 className="py-2 text-lg font-medium text-balance">
              Stripe Projects is requesting access
            </h2>
            <p className="text-sm text-center text-foreground-light text-balance">
              Stripe Projects wants to connect to the Supabase account for{' '}
              <strong>{accountRequest?.email}</strong>.
              {emailMatches && !linkedOrg && (
                <> This will create a new Supabase organization linked to Stripe.</>
              )}
            </p>
            {!emailMatches ? (
              <>
                <Admonition type="warning" className="mt-4">
                  <p className="text-sm text-foreground-light">
                    You're signed in as a different account. Sign out and sign back in as{' '}
                    <strong className="text-foreground">{accountRequest?.email}</strong>. Then
                    return to Stripe to restart the request.
                  </p>
                </Admonition>
                <div className="py-6">
                  <Button size="small" type="default" onClick={() => signOut()}>
                    Sign out
                  </Button>
                </div>
              </>
            ) : linkedOrg ? (
              // Org already linked to this Stripe account — inform user and confirm
              <>
                <Admonition type="note" className="mt-4" showIcon>
                  <p className="text-sm text-foreground-light">
                    <strong className="text-foreground">{linkedOrg.name}</strong> is already linked
                    to Stripe. Authorize Stripe Projects to continue.
                  </p>
                </Admonition>
                <div className="py-6">
                  <Button
                    size="small"
                    type="primary"
                    disabled={isConfirming}
                    onClick={handleApprove}
                  >
                    Authorize Stripe Projects
                  </Button>
                </div>
              </>
            ) : (
              // No linked org — a new one will be created
              <div className="py-6">
                <Button size="small" type="primary" disabled={isConfirming} onClick={handleApprove}>
                  Authorize Stripe Projects
                </Button>
              </div>
            )}
          </>
        ) : isError ? (
          <>
            <h2 className="py-2 text-lg font-medium text-destructive">Error</h2>
            <p className="text-foreground-light">{error?.message}</p>
            <div className="py-6">
              <Button size="small" type="default" onClick={() => signOut()}>
                Sign out
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </APIAuthorizationLayout>
  )
}

export default withAuth(StripeProjectsLoginPage)
