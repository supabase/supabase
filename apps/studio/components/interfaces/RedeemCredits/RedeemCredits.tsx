import { FeatureFlagContext } from 'common'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Button, Card, CardContent } from 'ui'
import { Admonition, ShimmeringLoader } from 'ui-patterns'

import { OrganizationSelector } from '../Connect/OrganizationSelector'
import {
  EMPTY_ORGANIZATIONS,
  MOCK_ORGANIZATIONS,
  MOCK_SELECTED_ORG_SLUG,
  RedeemCreditsMockState,
} from './MockState'
import { CreditCodeRedemption } from '@/components/interfaces/Organization/BillingSettings/CreditCodeRedemption'
import {
  InterstitialAccountRow,
  InterstitialLayout,
  SupabaseLogo,
} from '@/components/layouts/InterstitialLayout'
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { useProfile } from '@/lib/profile'

const RETURN_TO_SELECTED_ORG_PARAM = 'selected_org'

const RedeemCreditsInterstitial = ({
  title,
  description,
  children,
}: {
  title: ReactNode
  description?: ReactNode
  children: ReactNode
}) => (
  <InterstitialLayout logo={<SupabaseLogo />} title={title} description={description}>
    <div className="px-6 pb-6">{children}</div>
  </InterstitialLayout>
)

export const RedeemCreditsScreen = ({ mock }: { mock?: RedeemCreditsMockState }) => {
  const router = useRouter()
  const { profile, isLoading: isLoadingProfile } = useProfile()
  const { hasLoaded } = useContext(FeatureFlagContext)
  const isMockMode = !!mock

  const [selectedOrgSlug, setSelectedOrgSlug] = useState<string | null>(
    mock === 'redeeming' ? MOCK_SELECTED_ORG_SLUG : null
  )
  const [redemptionModalOrgSlug, setRedemptionModalOrgSlug] = useState<string | null>(null)
  const appliedReturnSelectedOrgRef = useRef<string | null>(null)

  useEffect(() => {
    setSelectedOrgSlug(mock === 'redeeming' ? MOCK_SELECTED_ORG_SLUG : null)
    setRedemptionModalOrgSlug(null)
  }, [mock])

  const {
    data: organizations,
    error: organizationsError,
    isLoading: isLoadingOrganizations,
    isError: isOrganizationsError,
  } = useOrganizationsQuery({ enabled: !isMockMode })

  const organizationOptions = useMemo(
    () => (isMockMode ? MOCK_ORGANIZATIONS : (organizations ?? EMPTY_ORGANIZATIONS)),
    [isMockMode, organizations]
  )

  const returnSelectedOrgSlug =
    router.isReady && typeof router.query[RETURN_TO_SELECTED_ORG_PARAM] === 'string'
      ? router.query[RETURN_TO_SELECTED_ORG_PARAM]
      : null

  const displayName = profile?.primary_email ?? profile?.username

  const isLoading =
    mock === 'loading' ||
    (!isMockMode && (isLoadingProfile || isLoadingOrganizations || !hasLoaded))

  useEffect(() => {
    if (isMockMode || !returnSelectedOrgSlug) return
    if (appliedReturnSelectedOrgRef.current === returnSelectedOrgSlug) return

    const hasReturnedOrganization = organizationOptions.some(
      (organization) => organization.slug === returnSelectedOrgSlug
    )

    if (hasReturnedOrganization) {
      setSelectedOrgSlug(returnSelectedOrgSlug)
      appliedReturnSelectedOrgRef.current = returnSelectedOrgSlug
    }
  }, [isMockMode, organizationOptions, returnSelectedOrgSlug])

  if (isLoading) {
    return (
      <RedeemCreditsInterstitial
        title={<ShimmeringLoader className="mx-auto h-7 w-32 max-w-full py-0" />}
        description={<ShimmeringLoader className="mx-auto h-4 w-56 max-w-full py-0" />}
      >
        <ConnectLoadingCards />
      </RedeemCreditsInterstitial>
    )
  }

  if (mock === 'redeemed') {
    return (
      <RedeemCreditsInterstitial
        title="Credits redeemed"
        description="Your credits were applied to the selected organization"
      >
        <div className="flex flex-col gap-3">
          <Admonition
            type="success"
            title="$500 credits applied"
            description="Credits are automatically used toward future invoices for Acme Production."
          />
          <Button type="primary" block asChild>
            <Link href={`/org/${MOCK_SELECTED_ORG_SLUG}`}>Go to organization</Link>
          </Button>
        </div>
      </RedeemCreditsInterstitial>
    )
  }

  if (mock === 'already-redeemed' || mock === 'invalid' || mock === 'wrong-account') {
    const notice =
      mock === 'already-redeemed'
        ? {
            title: 'Code already redeemed',
            description:
              'This credit code has already been used. Check the billing page for the organization that redeemed it.',
          }
        : mock === 'wrong-account'
          ? {
              title: 'Wrong account',
              description:
                'Sign in with the Supabase account that owns the organization this credit code was issued for.',
            }
          : {
              title: 'Invalid code',
              description: 'Check the code and try again. Codes are case sensitive.',
            }

    return (
      <RedeemCreditsInterstitial
        title={notice.title}
        description="The credit code could not be redeemed"
      >
        <div className="flex flex-col gap-3">
          <Admonition type="warning" description={notice.description} />
        </div>
      </RedeemCreditsInterstitial>
    )
  }

  if (mock === 'error' || isOrganizationsError) {
    return (
      <RedeemCreditsInterstitial
        title="Unable to load credit redemption"
        description="Please try again before redeeming this code"
      >
        <div className="flex flex-col gap-3">
          <Admonition
            type="warning"
            description={
              <>
                We could not load your organizations.
                {organizationsError && (
                  <span className="mt-1 block text-foreground-lighter">
                    Error: {organizationsError.message}
                  </span>
                )}
              </>
            }
          />
        </div>
      </RedeemCreditsInterstitial>
    )
  }

  const isRedeeming = mock === 'redeeming'

  const createOrganizationParams = {
    returnTo: router.asPath || '/redeem',
    returnToOrgParam: RETURN_TO_SELECTED_ORG_PARAM,
  }

  const openRedemption = () => {
    if (!selectedOrgSlug || isRedeeming) return
    if (isMockMode) return
    setRedemptionModalOrgSlug(selectedOrgSlug)
  }

  return (
    <>
      <RedeemCreditsInterstitial
        title="Redeem credits"
        description="Choose an organization to redeem this code"
      >
        <div className="flex flex-col gap-5">
          <InterstitialAccountRow displayName={displayName} />

          <OrganizationSelector
            organizations={organizationOptions}
            selectedSlug={selectedOrgSlug}
            disabled={isRedeeming}
            onSelect={setSelectedOrgSlug}
            getOrganizationDescription={(organization) => `${organization.plan.name} Plan`}
            createLabel={
              organizationOptions.length === 0
                ? 'Create your first organization'
                : 'Create new organization'
            }
            createHrefParams={createOrganizationParams}
          />

          {organizationOptions.length === 0 && (
            <Admonition
              type="warning"
              description="Create an organization before redeeming this credit code."
            />
          )}

          <div className="flex flex-col gap-2">
            <Button
              type="primary"
              block
              loading={isRedeeming}
              disabled={!selectedOrgSlug || organizationOptions.length === 0 || isRedeeming}
              onClick={openRedemption}
            >
              Redeem credits
            </Button>
            <p className="text-center text-xs text-foreground-lighter text-balance">
              Credits apply to one organization and are used toward future invoices before your
              payment method is charged.
            </p>
          </div>
        </div>
      </RedeemCreditsInterstitial>

      {redemptionModalOrgSlug && (
        <CreditCodeRedemption
          modalVisible
          slug={redemptionModalOrgSlug}
          onClose={() => setRedemptionModalOrgSlug(null)}
        />
      )}
    </>
  )
}

const ConnectLoadingCards = () => (
  <div className="flex flex-col gap-5">
    <Card className="shadow-none">
      <CardContent className="flex items-center gap-3 border-none px-4 py-3">
        <ShimmeringLoader className="size-8 flex-shrink-0 rounded-full py-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <ShimmeringLoader className="h-3 w-20 py-0" />
          <ShimmeringLoader className="h-4 w-40 max-w-full py-0" />
        </div>
      </CardContent>
    </Card>
    <section className="space-y-2" aria-label="Organizations">
      <ShimmeringLoader className="h-3 w-24 py-0" />
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="shadow-none">
          <CardContent className="flex items-center gap-3 border-none px-4 py-3">
            <ShimmeringLoader className="size-9 flex-shrink-0 rounded-lg py-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <ShimmeringLoader className="h-4 w-32 py-0" />
              <ShimmeringLoader className="h-3 w-20 py-0" />
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
    <div className="flex flex-col gap-2">
      <ShimmeringLoader className="h-10 w-full py-0" />
      <ShimmeringLoader className="h-10 w-full py-0" />
    </div>
  </div>
)
