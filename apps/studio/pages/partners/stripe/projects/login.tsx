import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  LogoLoader,
  WarningIcon,
} from 'ui'

import { APIAuthorizationLayout } from '@/components/layouts/APIAuthorizationLayout'
import { useConfirmAccountRequestMutation } from '@/data/partners/stripe-projects-confirm-mutation'
import { accountRequestQueryOptions } from '@/data/partners/stripe-projects-query'
import { withAuth } from '@/hooks/misc/withAuth'
import { useSignOut } from '@/lib/auth'

const StripeProjectsLoginPage = () => {
  const router = useRouter()
  const { ar_id } = useParams()

  const signOut = useSignOut()

  const {
    data: accountRequest,
    isPending,
    isSuccess,
    isError,
    error,
  } = useQuery(accountRequestQueryOptions({ arId: ar_id }))

  const {
    mutate: confirmAccountRequest,
    isPending: isConfirming,
    isSuccess: isConfirmed,
  } = useConfirmAccountRequestMutation()

  useEffect(() => {
    if (!router.isReady) return

    if (!ar_id) {
      router.push('/404')
      return
    }
  }, [router.isReady, ar_id, router])

  const handleApprove = async () => {
    if (!ar_id || isConfirming) return
    confirmAccountRequest({ arId: ar_id })
  }

  const linkedOrg = accountRequest?.linked_organization
  const emailMatches = accountRequest?.email_matches ?? false

  const loadingText = linkedOrg ? 'Completing authorization...' : 'Creating your organization...'
  const successTitle = linkedOrg ? 'Authorization Complete' : 'Organization Created'
  const successDescription = linkedOrg
    ? null
    : 'Your Supabase organization has been created and linked to your Stripe account.'

  return (
    <APIAuthorizationLayout HeadProvider={Head}>
      <div className="flex flex-col items-center min-h-[500px]">
        {isConfirming ? (
          <>
            <LogoLoader />
            <p className="pt-4 text-foreground-light">{loadingText}</p>
          </>
        ) : isConfirmed ? (
          <>
            <h2 className="py-2 text-lg font-medium">{successTitle}</h2>
            {successDescription && <p className="text-foreground-light">{successDescription}</p>}
            <p className="pt-4 text-sm text-foreground-lighter">You can close this window.</p>
          </>
        ) : isPending ? (
          <LogoLoader />
        ) : isSuccess ? (
          <>
            <h2 className="py-2 text-lg font-medium">Stripe Account Authorization</h2>
            <p className="text-center text-foreground-light">
              Stripe wants to link a Supabase organization for{' '}
              <strong>{accountRequest.email}</strong>.
            </p>

            {!emailMatches ? (
              <>
                <Alert_Shadcn_ variant="warning" className="mt-4">
                  <WarningIcon />
                  <AlertTitle_Shadcn_>Wrong account</AlertTitle_Shadcn_>
                  <AlertDescription_Shadcn_>
                    You need to be logged in as <strong>{accountRequest.email}</strong> to approve
                    this request.
                  </AlertDescription_Shadcn_>
                </Alert_Shadcn_>
                <div className="py-6">
                  <Button size="large" type="default" onClick={() => signOut()}>
                    Sign out
                  </Button>
                </div>
              </>
            ) : linkedOrg ? (
              // Org already linked to this Stripe account — inform user and confirm
              <>
                <p className="mt-4 text-sm text-foreground-light text-center">
                  Your organization <strong>{linkedOrg.name}</strong> is already linked to your
                  Stripe account.
                </p>
                <div className="py-6">
                  <Button
                    size="large"
                    type="primary"
                    disabled={isConfirming}
                    onClick={handleApprove}
                  >
                    Continue
                  </Button>
                </div>
              </>
            ) : (
              // No linked org — a new one will be created
              <>
                <p className="mt-4 text-sm text-foreground-light text-center">
                  A new Supabase organization will be created and linked to your Stripe account.
                </p>
                <div className="py-6">
                  <Button
                    size="large"
                    type="primary"
                    disabled={isConfirming}
                    onClick={handleApprove}
                  >
                    Approve
                  </Button>
                </div>
              </>
            )}
          </>
        ) : isError ? (
          <>
            <h2 className="py-2 text-lg font-medium text-destructive">Error</h2>
            <p className="text-foreground-light">{error?.message}</p>
            <div className="py-6">
              <Button size="large" type="default" onClick={() => signOut()}>
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
