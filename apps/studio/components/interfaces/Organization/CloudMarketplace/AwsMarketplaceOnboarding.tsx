import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'
import { Admonition, ShimmeringLoader } from 'ui-patterns'

import {
  AwsMarketplaceInterstitial,
  ConnectLoadingCards,
  ContractIneligibilityNotice,
  getContractIneligibilityDescription,
  getOrganizationUnavailableReason,
} from './AwsMarketplaceOnboarding.components'
import { OrganizationSelector } from '@/components/interfaces/Connect/OrganizationSelector'
import AwsMarketplaceAutoRenewalWarning from '@/components/interfaces/Organization/CloudMarketplace/AwsMarketplaceAutoRenewalWarning'
import {
  useCloudMarketplaceContractLinkingEligibilityQuery,
  useCloudMarketplaceOnboardingInfoQuery,
  type CloudMarketplaceOnboardingInfo,
} from '@/components/interfaces/Organization/CloudMarketplace/cloud-marketplace-query'
import { NewAwsMarketplaceOrgModal } from '@/components/interfaces/Organization/CloudMarketplace/NewAwsMarketplaceOrgModal'
import { InterstitialAccountRow } from '@/components/layouts/InterstitialLayout'
import { InlineLink } from '@/components/ui/InlineLink'
import { useOrganizationLinkAwsMarketplaceMutation } from '@/data/organizations/organization-link-aws-marketplace-mutation'
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { DOCS_URL } from '@/lib/constants'
import { useProfile } from '@/lib/profile'
import type { Organization } from '@/types'

const EMPTY_ORGANIZATIONS: Organization[] = []

export const AwsMarketplaceOnboardingScreen = ({ buyerId }: { buyerId?: string }) => {
  const { profile } = useProfile()

  const [selectedOrgSlug, setSelectedOrgSlug] = useState<string | null>(null)
  const [linkedOrgSlug, setLinkedOrgSlug] = useState<string | null>(null)
  const [showOrgCreationDialog, setShowOrgCreationDialog] = useState(false)

  useEffect(() => {
    setSelectedOrgSlug(null)
    setLinkedOrgSlug(null)
    setShowOrgCreationDialog(false)
  }, [buyerId])

  const {
    data: organizations,
    error: organizationsError,
    isPending: isLoadingOrganizations,
    isError: isOrganizationsError,
  } = useOrganizationsQuery({ enabled: !!buyerId })

  const {
    data: contractLinkingEligibility,
    error: eligibilityError,
    isPending: isLoadingEligibility,
    isError: isEligibilityError,
  } = useCloudMarketplaceContractLinkingEligibilityQuery(
    { buyerId: buyerId ?? '' },
    { enabled: !!buyerId }
  )

  const shouldLoadOnboardingInfo = !!buyerId && contractLinkingEligibility?.eligibility.is_eligible

  const {
    data: onboardingInfo,
    error: onboardingInfoError,
    isPending: isLoadingOnboardingInfo,
    isError: isOnboardingInfoError,
  } = useCloudMarketplaceOnboardingInfoQuery(
    { buyerId: buyerId ?? '' },
    { enabled: !!shouldLoadOnboardingInfo }
  )

  const { mutate: linkOrganization, isPending: isLinkingOrganization } =
    useOrganizationLinkAwsMarketplaceMutation({
      onSuccess: (_, variables) => {
        setLinkedOrgSlug(variables.slug)
      },
      onError: (error) => {
        toast.error(error.message, { duration: 7_000 })
      },
    })

  const effectiveOrganizations = useMemo(
    () => organizations ?? EMPTY_ORGANIZATIONS,
    [organizations]
  )
  const effectiveIsLoading =
    isLoadingOrganizations ||
    isLoadingEligibility ||
    (contractLinkingEligibility?.eligibility.is_eligible && isLoadingOnboardingInfo)
  const effectiveIsError = isOrganizationsError || isEligibilityError || isOnboardingInfoError
  const effectiveError = organizationsError ?? eligibilityError ?? onboardingInfoError
  const displayName = profile?.primary_email ?? profile?.username
  const selectedOrganization = effectiveOrganizations.find(({ slug }) => slug === selectedOrgSlug)
  const orgLinked = linkedOrgSlug !== null
  const linkedOrganization =
    effectiveOrganizations.find(({ slug }) => slug === linkedOrgSlug) ?? selectedOrganization

  const { linkableOrganizations, unavailableOrganizations, eligibilityByOrganizationSlug } =
    useMemo(() => {
      const sortedOrganizations = effectiveOrganizations
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))

      if (!onboardingInfo) {
        return {
          linkableOrganizations: [],
          unavailableOrganizations: sortedOrganizations,
          eligibilityByOrganizationSlug: new Map<
            string,
            CloudMarketplaceOnboardingInfo['organization_linking_eligibility'][number]
          >(),
        }
      }

      const eligibilityBySlug = new Map(
        onboardingInfo.organization_linking_eligibility.map((eligibility) => [
          eligibility.slug,
          eligibility,
        ])
      )

      const linkable: Organization[] = []
      const unavailable: Organization[] = []

      sortedOrganizations.forEach((organization) => {
        const organizationEligibility = eligibilityBySlug.get(organization.slug)

        if (organizationEligibility?.is_eligible) {
          linkable.push(organization)
        } else {
          unavailable.push(organization)
        }
      })

      return {
        linkableOrganizations: linkable,
        unavailableOrganizations: unavailable,
        eligibilityByOrganizationSlug: eligibilityBySlug,
      }
    }, [onboardingInfo, effectiveOrganizations])

  if (!buyerId) {
    return (
      <AwsMarketplaceInterstitial>
        <div className="flex flex-col gap-3">
          <Admonition
            type="warning"
            title="Setup unavailable"
            description={
              <p>
                Open the onboarding link from AWS Marketplace again. The link must include a{' '}
                <code className="text-code-inline">buyer_id</code> parameter.
              </p>
            }
          />
          <Button type="default" block asChild>
            <Link href="/organizations">Back to dashboard</Link>
          </Button>
        </div>
      </AwsMarketplaceInterstitial>
    )
  }

  if (effectiveIsLoading) {
    return (
      <AwsMarketplaceInterstitial
        description={<ShimmeringLoader className="mx-auto h-4 w-56 max-w-full py-0" />}
      >
        <ConnectLoadingCards />
      </AwsMarketplaceInterstitial>
    )
  }

  if (effectiveIsError) {
    return (
      <AwsMarketplaceInterstitial>
        <div className="flex flex-col gap-3">
          <Admonition
            type="warning"
            title="Unable to load setup"
            description={
              <>
                Please try again. If the problem persists, contact support.
                {effectiveError && (
                  <span className="mt-1 block text-foreground-lighter">
                    Error: {effectiveError.message}
                  </span>
                )}
              </>
            }
          />
          <Button type="default" block asChild>
            <Link href="/organizations">Back to dashboard</Link>
          </Button>
        </div>
      </AwsMarketplaceInterstitial>
    )
  }

  if (!contractLinkingEligibility?.eligibility.is_eligible) {
    const reason = contractLinkingEligibility?.eligibility.reasons[0]

    return (
      <AwsMarketplaceInterstitial description={getContractIneligibilityDescription(reason)}>
        <div className="flex flex-col gap-3">
          <ContractIneligibilityNotice reason={reason} />
          <Button type="default" block asChild>
            <Link href="/organizations">Back to dashboard</Link>
          </Button>
        </div>
      </AwsMarketplaceInterstitial>
    )
  }

  if (orgLinked) {
    return (
      <AwsMarketplaceInterstitial>
        <div className="flex flex-col gap-3">
          <Admonition
            type="success"
            title="Organization linked"
            description={
              linkedOrganization
                ? `${linkedOrganization.name} will be billed through AWS Marketplace.`
                : 'The selected organization will be billed through AWS Marketplace.'
            }
          />
          <Button type="primary" block asChild>
            <Link href={`/org/${linkedOrganization?.slug ?? linkedOrgSlug}`}>
              Go to organization
            </Link>
          </Button>
        </div>
      </AwsMarketplaceInterstitial>
    )
  }

  const showAutoRenewalWarning =
    onboardingInfo &&
    !onboardingInfo.aws_contract_auto_renewal &&
    !onboardingInfo.aws_contract_is_private_offer
  const hasLinkableOrganizations = linkableOrganizations.length > 0
  const hasAnyOrganizations = effectiveOrganizations.length > 0
  const isLinking = isLinkingOrganization
  const primaryLabel = hasLinkableOrganizations ? 'Link organization' : 'Create organization'
  const primaryAction = hasLinkableOrganizations
    ? () => {
        if (!selectedOrgSlug || !buyerId) return
        linkOrganization({ slug: selectedOrgSlug, buyerId })
      }
    : () => setShowOrgCreationDialog(true)

  return (
    <>
      <AwsMarketplaceInterstitial>
        <div className="flex flex-col gap-5">
          {showAutoRenewalWarning && (
            <AwsMarketplaceAutoRenewalWarning
              awsContractEndDate={onboardingInfo.aws_contract_end_date}
              awsContractSettingsUrl={onboardingInfo.aws_contract_settings_url}
            />
          )}

          <InterstitialAccountRow displayName={displayName} />

          {hasAnyOrganizations && (
            <OrganizationSelector
              organizations={linkableOrganizations}
              unavailableOrganizations={unavailableOrganizations}
              unavailableReason="These may have outstanding invoices or existing marketplace links."
              getUnavailableOrganizationDescription={(organization) =>
                getOrganizationUnavailableReason(
                  eligibilityByOrganizationSlug.get(organization.slug)?.reasons[0]
                )
              }
              selectedSlug={selectedOrgSlug}
              disabled={isLinking}
              onSelect={setSelectedOrgSlug}
              createLabel={hasLinkableOrganizations ? 'Create new organization' : undefined}
              onCreate={hasLinkableOrganizations ? () => setShowOrgCreationDialog(true) : undefined}
            />
          )}

          {!hasLinkableOrganizations && hasAnyOrganizations && (
            <Admonition
              type="warning"
              description="None of your current organizations can be linked to this AWS Marketplace subscription."
            />
          )}

          <div className="flex flex-col gap-5">
            <Button
              type="primary"
              block
              loading={isLinking}
              disabled={hasLinkableOrganizations && (!selectedOrgSlug || isLinking)}
              onClick={primaryAction}
            >
              {primaryLabel}
            </Button>
            <p className="text-center text-xs text-foreground-lighter text-balance">
              <InlineLink href={`${DOCS_URL}/guides/platform/aws-marketplace`}>
                Learn more
              </InlineLink>{' '}
              about billing through AWS.
            </p>
          </div>
        </div>
      </AwsMarketplaceInterstitial>

      {buyerId && (
        <NewAwsMarketplaceOrgModal
          visible={showOrgCreationDialog}
          onClose={() => setShowOrgCreationDialog(false)}
          buyerId={buyerId}
          onSuccess={(newlyCreatedOrgSlug) => {
            setShowOrgCreationDialog(false)
            setLinkedOrgSlug(newlyCreatedOrgSlug)
          }}
        />
      )}
    </>
  )
}
