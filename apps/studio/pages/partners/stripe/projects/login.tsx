import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
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

// ---------------------------------------------------------------------------
// Mock data — design review only
// Navigate to /partners/stripe/projects/login?mock=<state> to preview each UI state.
// States: pending | linked | wrong-account | success
// ---------------------------------------------------------------------------
const MOCK_RESPONSES = {
  pending: {
    id: 'mock',
    email: 'jane@acmecorp.io',
    email_matches: true,
    status: 'pending' as const,
    expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
    linked_organization: undefined,
  },
  linked: {
    id: 'mock',
    email: 'jane@acmecorp.io',
    email_matches: true,
    status: 'pending' as const,
    expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
    linked_organization: { id: 42, name: 'Acme Corp', slug: 'acme-corp' },
  },
  'wrong-account': {
    id: 'mock',
    email: 'jane@acmecorp.io',
    email_matches: false,
    status: 'pending' as const,
    expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
    linked_organization: undefined,
  },
  success: {
    id: 'mock',
    email: 'jane@acmecorp.io',
    email_matches: true,
    status: 'complete' as const,
    expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
    linked_organization: undefined,
  },
}

type MockState = keyof typeof MOCK_RESPONSES

const StripeProjectsLoginPage = () => {
  const router = useRouter()
  const { ar_id } = useParams()

  const signOut = useSignOut()

  const mockParam = router.query.mock as MockState | undefined
  const isMockMode = !!mockParam && mockParam in MOCK_RESPONSES

  const [mockConfirming, setMockConfirming] = useState(false)
  const [mockConfirmed, setMockConfirmed] = useState(false)

  const {
    data: accountRequest,
    isPending,
    isSuccess,
    isError,
    error,
  } = useQuery({
    ...accountRequestQueryOptions({ arId: ar_id }),
    enabled: !isMockMode && typeof ar_id !== 'undefined',
  })

  const {
    mutate: confirmAccountRequest,
    isPending: isConfirming,
    isSuccess: isConfirmed,
  } = useConfirmAccountRequestMutation()

  useEffect(() => {
    if (!router.isReady) return
    if (isMockMode) return // skip 404 redirect in mock mode

    if (!ar_id) {
      router.push('/404')
      return
    }
  }, [router.isReady, ar_id, isMockMode, router])

  const handleApprove = async () => {
    if (isMockMode) {
      setMockConfirming(true)
      setTimeout(() => {
        setMockConfirming(false)
        setMockConfirmed(true)
      }, 1200)
      return
    }
    if (!ar_id || isConfirming) return
    confirmAccountRequest({ arId: ar_id })
  }

  // Overlay real state with mock values when in mock mode
  const effectiveAccountRequest = isMockMode
    ? MOCK_RESPONSES[mockParam as MockState]
    : accountRequest
  const effectiveIsPending = isMockMode ? false : isPending
  const effectiveIsSuccess = isMockMode ? mockParam !== 'success' : isSuccess
  const effectiveIsConfirmed = isMockMode ? mockParam === 'success' || mockConfirmed : isConfirmed
  const effectiveIsConfirming = isMockMode ? mockConfirming : isConfirming
  const effectiveIsError = isMockMode ? false : isError

  const linkedOrg = effectiveAccountRequest?.linked_organization
  const emailMatches = effectiveAccountRequest?.email_matches ?? false

  const loadingText = linkedOrg ? 'Completing authorization...' : 'Creating your organization...'
  const successTitle = linkedOrg ? 'Authorization complete' : 'Organization created'
  const successDescription = linkedOrg
    ? null
    : 'Your Supabase organization has been created and linked to your Stripe account.'

  return (
    <APIAuthorizationLayout HeadProvider={Head}>
      {isMockMode && (
        <div className="fixed top-3 right-3 z-50 rounded border border-dashed border-warning bg-warning/10 px-2 py-1 text-xs text-warning-600 font-mono">
          mock: {mockParam}
        </div>
      )}
      <div className="flex flex-col items-center min-h-[500px]">
        {effectiveIsConfirming ? (
          <>
            <LogoLoader />
            <p className="pt-4 text-foreground-light">{loadingText}</p>
          </>
        ) : effectiveIsConfirmed ? (
          <>
            <StripeIcon />
            <h2 className="py-2 text-lg font-medium">{successTitle}</h2>
            {successDescription && (
              <p className="text-sm text-foreground-light">{successDescription}</p>
            )}
            <p className="pt-2 text-sm text-foreground-muted">You can now close this window</p>
          </>
        ) : effectiveIsPending ? (
          <LogoLoader />
        ) : effectiveIsSuccess ? (
          <>
            <StripeIcon />
            <h2 className="py-2 text-lg font-medium">Stripe Projects is requesting access</h2>
            <p className="text-center text-foreground-light">
              Stripe Projects wants to connect to your Supabase account.
            </p>
            <p className="text-center text-sm text-foreground-lighter">
              This request is for <strong>{effectiveAccountRequest.email}</strong>.
            </p>

            {!emailMatches ? (
              <>
                <Alert_Shadcn_ variant="warning" className="mt-4">
                  <WarningIcon />
                  <AlertTitle_Shadcn_>Wrong account</AlertTitle_Shadcn_>
                  <AlertDescription_Shadcn_>
                    You're signed in as a different account. Sign out and sign back in as{' '}
                    <strong>{effectiveAccountRequest.email}</strong>, then return to Stripe to
                    restart the request.
                  </AlertDescription_Shadcn_>
                </Alert_Shadcn_>
                <div className="py-6">
                  <Button size="large" type="primary" onClick={() => signOut()}>
                    Sign out
                  </Button>
                </div>
              </>
            ) : linkedOrg ? (
              // Org already linked to this Stripe account — inform user and confirm
              <>
                <p className="mt-4 text-sm text-foreground-light text-center">
                  <strong>{linkedOrg.name}</strong> is already connected to your Stripe account.
                  Confirm to complete the request.
                </p>
                <div className="py-6">
                  <Button
                    size="large"
                    type="primary"
                    disabled={effectiveIsConfirming}
                    onClick={handleApprove}
                  >
                    Authorize Stripe Projects
                  </Button>
                </div>
              </>
            ) : (
              // No linked org — a new one will be created
              <>
                <p className="mt-4 text-sm text-foreground-light text-center">
                  Approving will create a new Supabase organization linked to your Stripe account.
                </p>
                <div className="py-6">
                  <Button
                    size="large"
                    type="primary"
                    disabled={effectiveIsConfirming}
                    onClick={handleApprove}
                  >
                    Authorize Stripe Projects
                  </Button>
                </div>
              </>
            )}
          </>
        ) : effectiveIsError ? (
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
