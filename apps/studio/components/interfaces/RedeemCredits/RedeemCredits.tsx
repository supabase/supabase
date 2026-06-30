import { FeatureFlagContext } from 'common'
import { useRouter } from 'next/router'
import { ReactNode, useContext, useEffect, useRef, useState } from 'react'
import { Button, Card, CardContent } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { OrganizationSelector } from '../Connect/OrganizationSelector'
import { CreditCodeRedemption } from '@/components/interfaces/Organization/BillingSettings/CreditCodeRedemption'
import {
  InterstitialAccountRow,
  InterstitialLayout,
  SupabaseLogo,
} from '@/components/layouts/InterstitialLayout'
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { useProfile } from '@/lib/profile'
import { EMPTY_ARR } from '@/lib/void'

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

export const RedeemCreditsScreen = () => {
  const router = useRouter()
  const { profile, isLoading: isLoadingProfile } = useProfile()
  const { hasLoaded } = useContext(FeatureFlagContext)

  const [selectedOrgSlug, setSelectedOrgSlug] = useState<string | null>(null)
  const [redemptionModalOrgSlug, setRedemptionModalOrgSlug] = useState<string | null>(null)
  const appliedReturnSelectedOrgRef = useRef<string | null>(null)

  const {
    data: organizationOptions = EMPTY_ARR,
    error: organizationsError,
    isLoading: isLoadingOrganizations,
    isError: isOrganizationsError,
  } = useOrganizationsQuery()

  const returnSelectedOrgSlug =
    router.isReady && typeof router.query[RETURN_TO_SELECTED_ORG_PARAM] === 'string'
      ? router.query[RETURN_TO_SELECTED_ORG_PARAM]
      : null

  const displayName = profile?.primary_email ?? profile?.username

  const isLoading = isLoadingProfile || isLoadingOrganizations || !hasLoaded

  useEffect(() => {
    if (!returnSelectedOrgSlug) return
    if (appliedReturnSelectedOrgRef.current === returnSelectedOrgSlug) return

    const hasReturnedOrganization = (organizationOptions ?? []).some(
      (organization) => organization.slug === returnSelectedOrgSlug
    )

    if (hasReturnedOrganization) {
      setSelectedOrgSlug(returnSelectedOrgSlug)
      appliedReturnSelectedOrgRef.current = returnSelectedOrgSlug
    }
  }, [organizationOptions, returnSelectedOrgSlug])

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

  if (isOrganizationsError) {
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

  const createOrganizationParams = {
    returnTo: router.asPath || '/redeem',
    returnToOrgParam: RETURN_TO_SELECTED_ORG_PARAM,
  }

  const openRedemption = () => {
    if (!selectedOrgSlug) return
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
              block
              variant="primary"
              disabled={!selectedOrgSlug || organizationOptions.length === 0}
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
