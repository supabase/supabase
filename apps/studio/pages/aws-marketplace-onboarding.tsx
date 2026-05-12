import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'ui'
import { Admonition, ShimmeringLoader } from 'ui-patterns'

import {
  ConnectMockMenu,
  ConnectPreviewToolbar,
  getConnectMockState,
  isTemporaryConnectMockPreviewEnabled,
} from '@/components/interfaces/Connect/ConnectMockMenu'
import { ConnectOrganizationSelector } from '@/components/interfaces/Connect/ConnectOrganizationSelector'
import AwsMarketplaceAutoRenewalWarning from '@/components/interfaces/Organization/CloudMarketplace/AwsMarketplaceAutoRenewalWarning'
import {
  useCloudMarketplaceContractLinkingEligibilityQuery,
  useCloudMarketplaceOnboardingInfoQuery,
  type CloudMarketplaceContractLinkingEligibility,
  type CloudMarketplaceContractLinkingIneligibilityReason,
  type CloudMarketplaceOnboardingInfo,
} from '@/components/interfaces/Organization/CloudMarketplace/cloud-marketplace-query'
import NewAwsMarketplaceOrgModal from '@/components/interfaces/Organization/CloudMarketplace/NewAwsMarketplaceOrgModal'
import {
  InterstitialAccountRow,
  InterstitialLayout,
  LogoBox,
  LogoPair,
  SupabaseLogo,
} from '@/components/layouts/InterstitialLayout'
import { InlineLink } from '@/components/ui/InlineLink'
import { useOrganizationLinkAwsMarketplaceMutation } from '@/data/organizations/organization-link-aws-marketplace-mutation'
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { withAuth } from '@/hooks/misc/withAuth'
import { DOCS_URL } from '@/lib/constants'
import { buildStudioPageTitle } from '@/lib/page-title'
import { useProfile } from '@/lib/profile'
import type { NextPageWithLayout, Organization } from '@/types'

export const AWS_MARKETPLACE_MOCK_STATES = [
  'loading',
  'link-existing',
  'linking',
  'linked',
  'create-new',
  'not-eligible',
  'already-linked',
  'wrong-account',
  'invalid',
  'error',
] as const

export type AwsMarketplaceMockState = (typeof AWS_MARKETPLACE_MOCK_STATES)[number]

const MOCK_BUYER_ID = 'buyer-mock-123456'
const MOCK_LINKED_ORG_SLUG = 'acme-production'
const PAGE_TITLE = buildStudioPageTitle({ section: 'Link AWS Marketplace', brand: 'Supabase' })
const INTERSTITIAL_TITLE = 'Link AWS Marketplace'
const INTERSTITIAL_DESCRIPTION = 'Choose an organization to bill through AWS'

const createMockOrganization = (details: Partial<Organization>): Organization => ({
  id: 1,
  name: 'Acme Production',
  slug: MOCK_LINKED_ORG_SLUG,
  plan: { id: 'pro', name: 'Pro' },
  managed_by: 'supabase',
  is_owner: true,
  billing_email: 'billing@example.com',
  billing_partner: null,
  integration_source: null,
  usage_billing_enabled: true,
  stripe_customer_id: 'cus_mock',
  subscription_id: 'sub_mock',
  organization_requires_mfa: false,
  opt_in_tags: [],
  restriction_status: null,
  restriction_data: null,
  organization_missing_address: false,
  organization_missing_tax_id: false,
  ...details,
})

const MOCK_ORGANIZATIONS = [
  createMockOrganization({ id: 1, name: 'Acme Production', slug: MOCK_LINKED_ORG_SLUG }),
  createMockOrganization({ id: 2, name: 'Acme Staging', slug: 'acme-staging' }),
  createMockOrganization({
    id: 3,
    name: 'Legacy Billing',
    slug: 'legacy-billing',
    billing_partner: 'aws_marketplace',
  }),
  createMockOrganization({
    id: 4,
    name: 'Overdue Invoices',
    slug: 'overdue-invoices',
  }),
]
const EMPTY_ORGANIZATIONS: Organization[] = []

const createEligibility = (
  overrides: Partial<CloudMarketplaceContractLinkingEligibility['eligibility']> = {}
): CloudMarketplaceContractLinkingEligibility => ({
  eligibility: {
    is_eligible: true,
    reasons: [],
    aws_agreement_id: 'agreement-mock-123',
    ...overrides,
  },
})

const createOnboardingInfo = (
  organizations: Organization[],
  overrides: Partial<CloudMarketplaceOnboardingInfo> = {}
): CloudMarketplaceOnboardingInfo => ({
  aws_contract_auto_renewal: true,
  aws_contract_end_date: '2026-12-31T00:00:00.000Z',
  aws_contract_is_private_offer: false,
  aws_contract_settings_url: 'https://aws.amazon.com/marketplace',
  aws_contract_start_date: '2026-01-01T00:00:00.000Z',
  organization_linking_eligibility: organizations.map((organization, index) => ({
    slug: organization.slug,
    is_eligible: index < 2,
    reasons: index < 2 ? [] : ['ALREADY_MANAGED_BY_PARTNER_AWS'],
  })),
  plan_name_selected_on_marketplace: 'Team',
  ...overrides,
})

const AwsLogo = () => (
  <LogoBox className="border-[#232f3e] dark:border-control bg-[#232f3e]">
    <img alt="AWS" src="/img/icons/aws-icon.svg" className="w-8 mt-1" />
  </LogoBox>
)

const AwsMarketplaceOnboardingPage: NextPageWithLayout = () => {
  const router = useRouter()
  const buyerId = typeof router.query.buyer_id === 'string' ? router.query.buyer_id : undefined
  const mock =
    router.isReady && isTemporaryConnectMockPreviewEnabled()
      ? getConnectMockState(router.query.mock, AWS_MARKETPLACE_MOCK_STATES)
      : undefined

  const replaceMockState = (state: AwsMarketplaceMockState) => {
    router.replace(
      { pathname: router.pathname, query: { ...router.query, mock: state } },
      undefined,
      { shallow: true }
    )
  }

  if (!router.isReady) return null

  return (
    <>
      <Head>
        <title>{PAGE_TITLE}</title>
      </Head>
      {mock && (
        <ConnectPreviewToolbar>
          <ConnectMockMenu
            state={mock}
            states={AWS_MARKETPLACE_MOCK_STATES}
            onSelect={replaceMockState}
          />
        </ConnectPreviewToolbar>
      )}
      <AwsMarketplaceOnboardingScreen buyerId={buyerId} mock={mock} />
    </>
  )
}

export const AwsMarketplaceOnboardingScreen = ({
  buyerId,
  mock,
}: {
  buyerId?: string
  mock?: AwsMarketplaceMockState
}) => {
  const { profile } = useProfile()
  const effectiveBuyerId = buyerId ?? (mock ? MOCK_BUYER_ID : undefined)
  const isMockMode = !!mock

  const [selectedOrgSlug, setSelectedOrgSlug] = useState<string | null>(
    mock === 'linking' ? MOCK_LINKED_ORG_SLUG : null
  )
  const [linkedOrgSlug, setLinkedOrgSlug] = useState<string | null>(null)
  const [showOrgCreationDialog, setShowOrgCreationDialog] = useState(false)

  useEffect(() => {
    setSelectedOrgSlug(mock === 'linking' ? MOCK_LINKED_ORG_SLUG : null)
    setLinkedOrgSlug(null)
    setShowOrgCreationDialog(false)
  }, [mock])

  const {
    data: organizations,
    error: organizationsError,
    isPending: isLoadingOrganizations,
    isError: isOrganizationsError,
  } = useOrganizationsQuery({ enabled: !isMockMode })

  const {
    data: contractLinkingEligibility,
    error: eligibilityError,
    isPending: isLoadingEligibility,
    isError: isEligibilityError,
  } = useCloudMarketplaceContractLinkingEligibilityQuery(
    { buyerId: effectiveBuyerId ?? '' },
    { enabled: !isMockMode && !!effectiveBuyerId }
  )

  const shouldLoadOnboardingInfo =
    !isMockMode && !!effectiveBuyerId && contractLinkingEligibility?.eligibility.is_eligible

  const {
    data: onboardingInfo,
    error: onboardingInfoError,
    isPending: isLoadingOnboardingInfo,
    isError: isOnboardingInfoError,
  } = useCloudMarketplaceOnboardingInfoQuery(
    { buyerId: effectiveBuyerId ?? '' },
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

  const mockOrganizations =
    mock === 'create-new' || mock === 'invalid' || mock === 'error'
      ? EMPTY_ORGANIZATIONS
      : MOCK_ORGANIZATIONS
  const mockEligibility =
    mock === 'not-eligible'
      ? createEligibility({ is_eligible: false, reasons: ['NO_ACTIVE_CONTRACT_FOUND'] })
      : mock === 'already-linked'
        ? createEligibility({ is_eligible: false, reasons: ['AGREEMENT_BASED_OFFER'] })
        : createEligibility()
  const mockOnboardingInfo = createOnboardingInfo(mockOrganizations)

  const effectiveOrganizations = useMemo(
    () => (isMockMode ? mockOrganizations : (organizations ?? EMPTY_ORGANIZATIONS)),
    [isMockMode, mockOrganizations, organizations]
  )
  const effectiveEligibility = isMockMode ? mockEligibility : contractLinkingEligibility
  const effectiveOnboardingInfo = isMockMode ? mockOnboardingInfo : onboardingInfo
  const effectiveIsLoading =
    mock === 'loading' ||
    (!isMockMode &&
      (!effectiveBuyerId ||
        isLoadingOrganizations ||
        isLoadingEligibility ||
        (effectiveEligibility?.eligibility.is_eligible && isLoadingOnboardingInfo)))
  const effectiveIsError =
    mock === 'error' || isOrganizationsError || isEligibilityError || isOnboardingInfoError
  const effectiveError = organizationsError ?? eligibilityError ?? onboardingInfoError
  const displayName = profile?.primary_email ?? profile?.username
  const selectedOrganization = effectiveOrganizations.find(({ slug }) => slug === selectedOrgSlug)
  const orgLinked = mock === 'linked' || linkedOrgSlug !== null
  const linkedOrganization =
    effectiveOrganizations.find(({ slug }) => slug === (linkedOrgSlug ?? MOCK_LINKED_ORG_SLUG)) ??
    selectedOrganization

  const { linkableOrganizations, unavailableOrganizations, eligibilityByOrganizationSlug } =
    useMemo(() => {
      const sortedOrganizations = effectiveOrganizations
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))

      if (!effectiveOnboardingInfo) {
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
        effectiveOnboardingInfo.organization_linking_eligibility.map((eligibility) => [
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
    }, [effectiveOnboardingInfo, effectiveOrganizations])

  const withInterstitial = ({
    description,
    children,
  }: {
    description?: ReactNode
    children: ReactNode
  }) => (
    <InterstitialLayout
      logo={<LogoPair left={<AwsLogo />} right={<SupabaseLogo />} />}
      title={INTERSTITIAL_TITLE}
      description={description ?? INTERSTITIAL_DESCRIPTION}
    >
      <div className="px-6 pb-6">{children}</div>
    </InterstitialLayout>
  )

  if (mock === 'invalid' || (!isMockMode && !effectiveBuyerId)) {
    return withInterstitial({
      children: (
        <div className="flex flex-col gap-3">
          <Admonition
            type="warning"
            title="Setup unavailable"
            description="Open the onboarding link from AWS Marketplace again. The link must include a buyer_id parameter."
          />
          <Button type="default" block asChild>
            <Link href="/organizations">Back to dashboard</Link>
          </Button>
        </div>
      ),
    })
  }

  if (effectiveIsLoading) {
    return withInterstitial({
      description: <ShimmeringLoader className="mx-auto h-4 w-56 max-w-full py-0" />,
      children: <ConnectLoadingCards />,
    })
  }

  if (mock === 'wrong-account') {
    return withInterstitial({
      children: (
        <div className="flex flex-col gap-3">
          <Admonition
            type="warning"
            title="Wrong account"
            description="Sign in with the Supabase account that owns the organization you want to bill through AWS Marketplace, then open the onboarding link again."
          />
          <Button type="default" block asChild>
            <Link href="/organizations">Back to dashboard</Link>
          </Button>
        </div>
      ),
    })
  }

  if (effectiveIsError) {
    return withInterstitial({
      children: (
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
      ),
    })
  }

  if (!effectiveEligibility?.eligibility.is_eligible) {
    const reason = effectiveEligibility?.eligibility.reasons[0]

    return withInterstitial({
      description: getContractIneligibilityDescription(reason),
      children: (
        <div className="flex flex-col gap-3">
          <ContractIneligibilityNotice reason={reason} />
          <Button type="default" block asChild>
            <Link href="/organizations">Back to dashboard</Link>
          </Button>
        </div>
      ),
    })
  }

  if (orgLinked) {
    return withInterstitial({
      children: (
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
            <Link
              href={`/org/${linkedOrganization?.slug ?? linkedOrgSlug ?? MOCK_LINKED_ORG_SLUG}`}
            >
              Go to organization
            </Link>
          </Button>
        </div>
      ),
    })
  }

  const showAutoRenewalWarning =
    effectiveOnboardingInfo &&
    !effectiveOnboardingInfo.aws_contract_auto_renewal &&
    !effectiveOnboardingInfo.aws_contract_is_private_offer
  const hasLinkableOrganizations = linkableOrganizations.length > 0
  const hasAnyOrganizations = effectiveOrganizations.length > 0
  const isLinking = mock === 'linking' || isLinkingOrganization
  const primaryLabel = hasLinkableOrganizations ? 'Link organization' : 'Create organization'
  const primaryAction = hasLinkableOrganizations
    ? () => {
        if (!selectedOrgSlug || !effectiveBuyerId) return
        if (isMockMode) {
          setLinkedOrgSlug(selectedOrgSlug)
          return
        }
        linkOrganization({ slug: selectedOrgSlug, buyerId: effectiveBuyerId })
      }
    : () => setShowOrgCreationDialog(true)

  return (
    <>
      {withInterstitial({
        children: (
          <div className="flex flex-col gap-5">
            {showAutoRenewalWarning && (
              <AwsMarketplaceAutoRenewalWarning
                awsContractEndDate={effectiveOnboardingInfo.aws_contract_end_date}
                awsContractSettingsUrl={effectiveOnboardingInfo.aws_contract_settings_url}
              />
            )}

            <InterstitialAccountRow displayName={displayName} />

            <ConnectOrganizationSelector
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
              createLabel="Create new organization"
              onCreate={() => setShowOrgCreationDialog(true)}
            />

            {!hasLinkableOrganizations && hasAnyOrganizations && (
              <Admonition
                type="warning"
                description="None of your current organizations can be linked to this AWS Marketplace subscription."
              />
            )}

            {!hasAnyOrganizations && (
              <Admonition
                type="note"
                description="Create a new organization and it will be linked to AWS Marketplace automatically."
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
        ),
      })}

      {!isMockMode && effectiveBuyerId && (
        <NewAwsMarketplaceOrgModal
          visible={showOrgCreationDialog}
          onClose={() => setShowOrgCreationDialog(false)}
          buyerId={effectiveBuyerId}
          onSuccess={(newlyCreatedOrgSlug) => {
            setShowOrgCreationDialog(false)
            setLinkedOrgSlug(newlyCreatedOrgSlug)
          }}
        />
      )}

      {isMockMode && (
        <MockAwsMarketplaceOrgDialog
          visible={showOrgCreationDialog}
          onClose={() => setShowOrgCreationDialog(false)}
          onShowLinkedState={() => {
            setShowOrgCreationDialog(false)
            setLinkedOrgSlug('mock-created-organization')
          }}
        />
      )}
    </>
  )
}

const MockAwsMarketplaceOrgDialog = ({
  visible,
  onClose,
  onShowLinkedState,
}: {
  visible: boolean
  onClose: () => void
  onShowLinkedState: () => void
}) => (
  <Dialog open={visible} onOpenChange={(open) => !open && onClose()}>
    <DialogContent size="medium">
      <DialogHeader>
        <DialogTitle>Create and link organization</DialogTitle>
        <DialogDescription>
          In production, this opens a form to create an AWS-managed organization, then links it to
          the Marketplace subscription automatically
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button type="default" onClick={onClose}>
          Close
        </Button>
        <Button type="primary" onClick={onShowLinkedState}>
          Show linked state
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

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

function getOrganizationUnavailableReason(
  reason:
    | CloudMarketplaceOnboardingInfo['organization_linking_eligibility'][number]['reasons'][number]
    | undefined
) {
  switch (reason) {
    case 'ALREADY_MANAGED_BY_PARTNER_AWS':
      return 'Already linked to AWS Marketplace'
    case 'ALREADY_MANAGED_BY_PARTNER':
      return 'Already managed by another partner'
    case 'OVERDUE_INVOICES':
      return 'Outstanding invoices'
    default:
      return 'Not available for marketplace billing'
  }
}

function getContractIneligibilityDescription(
  reason: CloudMarketplaceContractLinkingIneligibilityReason | undefined
) {
  switch (reason) {
    case 'AWS_ACTIVATE_CREDITS_DEAL':
      return 'No further action is required for this AWS Activate credits offer.'
    case 'AGREEMENT_BASED_OFFER':
      return 'This private offer updated an existing AWS Marketplace subscription.'
    case 'NO_ACTIVE_CONTRACT_FOUND':
      return 'AWS is still syncing this Marketplace subscription.'
    default:
      return 'This AWS Marketplace subscription cannot be linked right now.'
  }
}

function ContractIneligibilityNotice({
  reason,
}: {
  reason: CloudMarketplaceContractLinkingIneligibilityReason | undefined
}) {
  switch (reason) {
    case 'AWS_ACTIVATE_CREDITS_DEAL':
      return (
        <Admonition
          type="success"
          title="Credits accepted"
          description="Your Supabase organization credit balance will be updated after AWS finishes processing the offer. This can take 1 or 2 days."
        />
      )
    case 'AGREEMENT_BASED_OFFER':
      return (
        <Admonition
          type="success"
          title="No action required"
          description="Your existing Supabase organization remains linked to AWS Marketplace and your projects will continue to run as usual."
        />
      )
    case 'NO_ACTIVE_CONTRACT_FOUND':
      return (
        <Admonition
          type="warning"
          title="Still syncing"
          description="Thanks for purchasing Supabase through AWS Marketplace. It can take a few minutes before the subscription is ready to link. Try again shortly."
        />
      )
    default:
      return (
        <Admonition
          type="warning"
          title="Unable to continue"
          description="Supabase could not determine why this Marketplace subscription is unavailable. Contact support if this keeps happening."
        />
      )
  }
}

export default withAuth(AwsMarketplaceOnboardingPage)
