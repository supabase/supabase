import { type ReactNode } from 'react'
import { Card, CardContent } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import type {
  CloudMarketplaceContractLinkingIneligibilityReason,
  CloudMarketplaceOnboardingInfo,
} from './cloud-marketplace-query'
import {
  InterstitialLayout,
  LogoBox,
  LogoPair,
  SupabaseLogo,
} from '@/components/layouts/InterstitialLayout'
import { BASE_PATH } from '@/lib/constants'

const INTERSTITIAL_TITLE = 'Link AWS Marketplace'
const INTERSTITIAL_DESCRIPTION = 'Choose an organization to bill through AWS'

const AwsLogo = () => (
  <LogoBox className="border-[#232f3e] dark:border-control bg-[#232f3e]">
    <img alt="AWS" src={`${BASE_PATH}/img/icons/aws-icon.svg`} className="w-8 mt-1" />
  </LogoBox>
)

export const AwsMarketplaceInterstitial = ({
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

export const ConnectLoadingCards = () => (
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

export function getOrganizationUnavailableReason(
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

export function getContractIneligibilityDescription(
  reason: CloudMarketplaceContractLinkingIneligibilityReason | undefined
) {
  switch (reason) {
    case 'AWS_ACTIVATE_CREDITS_DEAL':
      return 'No further action is required for this AWS Activate credits offer'
    case 'AGREEMENT_BASED_OFFER':
      return 'This private offer updated an existing AWS Marketplace subscription'
    case 'NO_ACTIVE_CONTRACT_FOUND':
      return 'AWS is still syncing this Marketplace subscription'
    default:
      return 'This AWS Marketplace subscription cannot be linked right now'
  }
}

export function ContractIneligibilityNotice({
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
      return <Admonition type="default" description="If the problem persists, contact support." />
  }
}
