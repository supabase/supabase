import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { LogOut } from 'lucide-react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { Button } from 'ui'
import { Admonition, ShimmeringLoader } from 'ui-patterns'

import {
  InterstitialAccountRow,
  InterstitialLayout,
  LogoPair,
  PartnerLogo,
  SupabaseLogo,
} from '@/components/layouts/InterstitialLayout'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useConfirmAccountRequestMutation } from '@/data/partners/stripe-projects-confirm-mutation'
import {
  accountRequestQueryOptions,
  type AccountRequestDetails,
} from '@/data/partners/stripe-projects-query'
import { withAuth } from '@/hooks/misc/withAuth'
import { useSignOut } from '@/lib/auth'
import { BASE_PATH } from '@/lib/constants'
import { buildStudioPageTitle } from '@/lib/page-title'
import { useProfileNameAndPicture } from '@/lib/profile'
import type { NextPageWithLayout } from '@/types'

const PAGE_TITLE = buildStudioPageTitle({ section: 'Authorize Stripe Projects', brand: 'Supabase' })
const STRIPE_PROJECTS_MOCK_STATES = ['pending', 'linked', 'wrong-account', 'success'] as const

type MockState = (typeof STRIPE_PROJECTS_MOCK_STATES)[number]

const MOCK_RESPONSES = {
  pending: {
    id: 'mock',
    email: 'jane@acmecorp.io',
    email_matches: true,
    status: 'pending',
    expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
    linked_organization: undefined,
  },
  linked: {
    id: 'mock',
    email: 'jane@acmecorp.io',
    email_matches: true,
    status: 'pending',
    expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
    linked_organization: { id: 42, name: 'Acme Corp', slug: 'acme-corp' },
  },
  'wrong-account': {
    id: 'mock',
    email: 'jane@acmecorp.io',
    email_matches: false,
    status: 'pending',
    expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
    linked_organization: undefined,
  },
  success: {
    id: 'mock',
    email: 'jane@acmecorp.io',
    email_matches: true,
    status: 'complete',
    expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
    linked_organization: undefined,
  },
} satisfies Record<MockState, AccountRequestDetails>

const getMockState = (value: unknown): MockState | undefined => {
  return typeof value === 'string' && STRIPE_PROJECTS_MOCK_STATES.includes(value as MockState)
    ? (value as MockState)
    : undefined
}

const isStripeProjectsMockPreviewEnabled = () => {
  if (process.env.NEXT_PUBLIC_ENVIRONMENT !== 'prod') return true
  if (typeof window === 'undefined') return false

  return window.location.hostname.endsWith('.vercel.app')
}

const StripeProjectsLoginPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ar_id } = useParams()
  const signOut = useSignOut()
  const { username, primaryEmail, avatarUrl } = useProfileNameAndPicture()
  const mock =
    router.isReady && isStripeProjectsMockPreviewEnabled()
      ? getMockState(router.query.mock)
      : undefined

  const [mockConfirming, setMockConfirming] = useState(false)
  const [mockConfirmed, setMockConfirmed] = useState(false)

  useEffect(() => {
    setMockConfirming(false)
    setMockConfirmed(false)
  }, [mock])

  const {
    data: accountRequest,
    isPending: isQueryPending,
    isSuccess: isQuerySuccess,
    isError: isQueryError,
    error,
  } = useQuery({
    ...accountRequestQueryOptions({ arId: ar_id }),
    enabled: !mock && typeof ar_id !== 'undefined',
  })

  const {
    mutate: confirmAccountRequest,
    isPending: isConfirmationPending,
    isSuccess: isConfirmationSuccess,
  } = useConfirmAccountRequestMutation()

  useEffect(() => {
    if (!router.isReady) return
    if (mock) return

    if (!ar_id) {
      router.push('/404')
    }
  }, [router.isReady, ar_id, mock, router])

  const handleApprove = async () => {
    if (mock) {
      setMockConfirming(true)
      setTimeout(() => {
        setMockConfirming(false)
        setMockConfirmed(true)
      }, 1200)
      return
    }

    if (!ar_id || isConfirmationPending) return
    confirmAccountRequest({ arId: ar_id })
  }

  const effectiveAccountRequest = mock ? MOCK_RESPONSES[mock] : accountRequest
  const linkedOrg = effectiveAccountRequest?.linked_organization
  const emailMatches = effectiveAccountRequest?.email_matches ?? false
  const displayName = primaryEmail ?? username ?? effectiveAccountRequest?.email ?? ''
  const isPending = mock ? false : router.isReady && isQueryPending
  const isConfirmed = mock ? mock === 'success' || mockConfirmed : isConfirmationSuccess
  const isConfirming = mock ? mockConfirming : isConfirmationPending
  const isSuccess = mock ? mock !== 'success' : isQuerySuccess
  const isError = mock ? false : isQueryError
  const showAuthorizationState = isSuccess && !isConfirmed
  const interstitialDescription = isConfirmed
    ? undefined
    : 'This will create an organization on your behalf in Supabase'

  return (
    <>
      <Head>
        <title>{PAGE_TITLE}</title>
      </Head>

      {mock && (
        <div className="fixed right-3 top-3 z-50 rounded-md border bg-warning-200 px-2 py-1 font-mono text-xs text-warning-1200">
          mock: {mock}
        </div>
      )}

      <InterstitialLayout
        logo={
          <LogoPair
            left={<PartnerLogo src={`${BASE_PATH}/img/icons/stripe-icon.svg`} alt="Stripe" />}
            right={<SupabaseLogo />}
          />
        }
        title="Authorize Stripe Projects"
        description={interstitialDescription}
      >
        <div className="px-6 pb-6">
          {isPending && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3 rounded-lg border border-secondary p-3">
                <ShimmeringLoader className="size-9 flex-shrink-0 rounded-full py-0" />
                <div className="min-w-0 flex-1 space-y-2">
                  <ShimmeringLoader className="h-3 w-20 py-0" />
                  <ShimmeringLoader className="h-4 w-40 max-w-full py-0" />
                </div>
                <div className="h-8 w-8 flex-shrink-0" />
              </div>
              <div className="flex flex-col gap-2">
                <ShimmeringLoader className="h-10 w-full py-0" />
                <ShimmeringLoader className="h-10 w-full py-0" />
              </div>
            </div>
          )}

          {isConfirmed && (
            <div className="flex flex-col gap-4">
              <Admonition type="success" title="Stripe Projects authorized" />
              <p className="text-center text-xs text-foreground-lighter text-balance">
                You can now close this tab.
              </p>
            </div>
          )}

          {showAuthorizationState && !emailMatches && (
            <div className="flex flex-col gap-3">
              <Admonition
                type="warning"
                description={
                  <>
                    You're signed in to a different account. Sign out and sign back in as{' '}
                    <span className="font-medium text-foreground">
                      {effectiveAccountRequest?.email}
                    </span>
                    . Then return to Stripe to restart the request.
                  </>
                }
              />
              <Button type="default" block onClick={() => signOut()}>
                Sign out
              </Button>
            </div>
          )}

          {showAuthorizationState && emailMatches && linkedOrg && (
            <div className="flex flex-col gap-3">
              <Admonition
                type="tip"
                description={
                  <>
                    <span className="font-medium text-foreground">{linkedOrg.name}</span> is already
                    linked to this Stripe account, and just needs to be confirmed.
                  </>
                }
              />
              <div className="flex flex-col gap-2">
                <Button type="primary" block loading={isConfirming} onClick={handleApprove}>
                  Authorize Stripe Projects
                </Button>
                <Button type="text" block onClick={() => router.push('/')}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {showAuthorizationState && emailMatches && !linkedOrg && (
            <div className="flex flex-col gap-6">
              <InterstitialAccountRow
                avatarUrl={avatarUrl}
                displayName={displayName}
                action={
                  <ButtonTooltip
                    type="text"
                    size="small"
                    className="h-8 w-8 px-0"
                    onClick={() => signOut()}
                    icon={
                      <LogOut size={16} strokeWidth={1.5} className="text-foreground-lighter" />
                    }
                    tooltip={{
                      content: {
                        side: 'top',
                        text: 'Sign out',
                      },
                    }}
                  />
                }
              />

              <div className="flex flex-col gap-2">
                <Button
                  type="primary"
                  loading={isConfirming}
                  disabled={isConfirming}
                  onClick={handleApprove}
                >
                  Create organization
                </Button>
                <Button type="text" onClick={() => router.push('/')}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {isError && (
            <div className="flex flex-col gap-3">
              <Admonition
                type="danger"
                title="Unable to load authorization"
                description={error?.message}
              />
              <Button type="default" block onClick={() => signOut()}>
                Sign out
              </Button>
            </div>
          )}
        </div>
      </InterstitialLayout>
    </>
  )
}

export default withAuth(StripeProjectsLoginPage)
