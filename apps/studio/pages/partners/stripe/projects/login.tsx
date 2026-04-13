import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { LogOut } from 'lucide-react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { Button } from 'ui'
import { Admonition, ShimmeringLoader } from 'ui-patterns'

import {
  ConnectMockMenu,
  ConnectPreviewToolbar,
  getConnectMockState,
  isTemporaryConnectMockPreviewEnabled,
} from '@/components/interfaces/Connect/ConnectMockMenu'
import {
  InterstitialAccountRow,
  InterstitialLayout,
  LogoPair,
  PartnerLogo,
  SupabaseLogo,
} from '@/components/layouts/InterstitialLayout'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useConfirmAccountRequestMutation } from '@/data/partners/stripe-projects-confirm-mutation'
import { accountRequestQueryOptions } from '@/data/partners/stripe-projects-query'
import { withAuth } from '@/hooks/misc/withAuth'
import { useSignOut } from '@/lib/auth'
import { BASE_PATH } from '@/lib/constants'
import { buildStudioPageTitle } from '@/lib/page-title'
import { useProfileNameAndPicture } from '@/lib/profile'
import type { NextPageWithLayout } from '@/types'

const STRIPE_PROJECTS_MOCK_STATES = ['pending', 'linked', 'wrong-account', 'success'] as const
const PAGE_TITLE = buildStudioPageTitle({ section: 'Authorize Stripe Projects', brand: 'Supabase' })

type MockState = (typeof STRIPE_PROJECTS_MOCK_STATES)[number]

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
} satisfies Record<MockState, unknown>

const StripeProjectsLoginPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ar_id } = useParams()

  const signOut = useSignOut()
  const { username, primaryEmail, avatarUrl } = useProfileNameAndPicture()

  const mock =
    router.isReady && isTemporaryConnectMockPreviewEnabled()
      ? getConnectMockState(router.query.mock, STRIPE_PROJECTS_MOCK_STATES)
      : undefined

  const [mockConfirming, setMockConfirming] = useState(false)
  const [mockConfirmed, setMockConfirmed] = useState(false)

  useEffect(() => {
    setMockConfirming(false)
    setMockConfirmed(false)
  }, [mock])

  const {
    data: accountRequest,
    isPending,
    isSuccess,
    isError,
    error,
  } = useQuery({
    ...accountRequestQueryOptions({ arId: ar_id }),
    enabled: !mock && typeof ar_id !== 'undefined',
  })

  const {
    mutate: confirmAccountRequest,
    isPending: isConfirming,
    isSuccess: isConfirmed,
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
    if (!ar_id || isConfirming) return
    confirmAccountRequest({ arId: ar_id })
  }

  const replaceMockState = (state: MockState) => {
    router.replace(
      { pathname: router.pathname, query: { ...router.query, mock: state } },
      undefined,
      { shallow: true }
    )
  }

  const effectiveAccountRequest = mock ? MOCK_RESPONSES[mock] : accountRequest
  const effectiveIsPending = mock ? false : router.isReady && isPending
  const effectiveIsSuccess = mock ? mock !== 'success' : isSuccess
  const effectiveIsConfirmed = mock ? mock === 'success' || mockConfirmed : isConfirmed
  const effectiveIsConfirming = mock ? mockConfirming : isConfirming
  const effectiveIsError = mock ? false : isError

  const linkedOrg = effectiveAccountRequest?.linked_organization
  const emailMatches = effectiveAccountRequest?.email_matches ?? false
  const displayName = primaryEmail ?? username ?? effectiveAccountRequest?.email ?? ''
  const showSuccessBranch = effectiveIsSuccess && !effectiveIsConfirmed
  const interstitialDescription = effectiveIsConfirmed
    ? undefined
    : 'This will create an organization on your behalf in Supabase'

  return (
    <>
      <Head>
        <title>{PAGE_TITLE}</title>
      </Head>

      {mock && (
        <ConnectPreviewToolbar>
          <ConnectMockMenu
            state={mock}
            states={STRIPE_PROJECTS_MOCK_STATES}
            onSelect={replaceMockState}
            width="w-[180px]"
          />
        </ConnectPreviewToolbar>
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
          {effectiveIsPending && (
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

          {effectiveIsConfirmed && (
            <div className="flex flex-col gap-4">
              <Admonition
                type="success"
                description="A new Supabase organization has been created and linked to your Stripe account."
              />
              <p className="text-center text-xs text-foreground-lighter text-balance">
                You can now close this tab.
              </p>
            </div>
          )}

          {showSuccessBranch && !emailMatches && (
            <div className="flex flex-col gap-3">
              <Admonition
                type="warning"
                description={
                  <>
                    You’re signed in to a different account. Sign out and sign back in as{' '}
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

          {showSuccessBranch && emailMatches && linkedOrg && (
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
                <Button
                  type="primary"
                  block
                  loading={effectiveIsConfirming}
                  onClick={handleApprove}
                >
                  Confirm
                </Button>
                <Button type="text" block onClick={() => router.push('/')}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {showSuccessBranch && emailMatches && !linkedOrg && (
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
                  loading={effectiveIsConfirming}
                  disabled={effectiveIsConfirming}
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

          {effectiveIsError && (
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
