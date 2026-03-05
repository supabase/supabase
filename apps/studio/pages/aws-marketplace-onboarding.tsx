import { useRouter } from 'next/router'

import type { NextPageWithLayout } from 'types'
import AwsMarketplaceCreateNewOrg from '../components/interfaces/Organization/CloudMarketplace/AwsMarketplaceCreateNewOrg'
import { AwsMarketplaceLinkExistingOrg } from '../components/interfaces/Organization/CloudMarketplace/AwsMarketplaceLinkExistingOrg'
import AwsMarketplaceOnboardingPlaceholder from '../components/interfaces/Organization/CloudMarketplace/AwsMarketplaceOnboardingPlaceholder'
import LinkAwsMarketplaceLayout from '../components/layouts/LinkAwsMarketplaceLayout'
import {
  ScaffoldContainer,
  ScaffoldDivider,
  ScaffoldHeader,
  ScaffoldTitle,
} from '../components/layouts/Scaffold'
import { useOrganizationsQuery } from '../data/organizations/organizations-query'
import { useCloudMarketplaceContractLinkingEligibilityQuery } from '../components/interfaces/Organization/CloudMarketplace/cloud-marketplace-query'
import AwsMarketplaceContractNotLinkable from '../components/interfaces/Organization/CloudMarketplace/AwsMarketplaceContractNotLinkable'

const AwsMarketplaceOnboarding: NextPageWithLayout = () => {
  const {
    query: { buyer_id: buyerId },
  } = useRouter()

  const {
    data: organizations,
    isFetched: isOrganizationsFetched,
    isSuccess: wasOrganizationsRequestSuccessful,
  } = useOrganizationsQuery()

  const {
    data: contractLinkingEligibility,
    isFetched: isContractLinkingEligibilityFetched,
    isSuccess: wasEligibilityRequestSuccessful,
  } = useCloudMarketplaceContractLinkingEligibilityQuery({
    buyerId: buyerId as string,
  })

  const renderContent = () => {
    if (!isOrganizationsFetched || !isContractLinkingEligibilityFetched) {
      return <AwsMarketplaceOnboardingPlaceholder />
    }

    if (!wasOrganizationsRequestSuccessful || !wasEligibilityRequestSuccessful) {
      return <p className="mt-4">Error loading AWS Marketplace setup page. Try again later.</p>
    }

    if (!contractLinkingEligibility.eligibility.is_eligible) {
      return (
        <AwsMarketplaceContractNotLinkable
          reason={contractLinkingEligibility.eligibility.reasons[0]}
        />
      )
    }

    if (organizations?.length) {
      return <AwsMarketplaceLinkExistingOrg organizations={organizations} />
    }

    return <AwsMarketplaceCreateNewOrg />
  }

  return (
    <ScaffoldContainer>
      <ScaffoldHeader>
        <ScaffoldTitle>AWS Marketplace Setup</ScaffoldTitle>
      </ScaffoldHeader>
      <ScaffoldDivider />
      {renderContent()}
    </ScaffoldContainer>
  )
}

AwsMarketplaceOnboarding.getLayout = (page) => (
  <LinkAwsMarketplaceLayout>{page}</LinkAwsMarketplaceLayout>
)

export default AwsMarketplaceOnboarding
