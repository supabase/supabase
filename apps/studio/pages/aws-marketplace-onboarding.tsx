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

  return (
    <ScaffoldContainer>
      <ScaffoldHeader>
        <ScaffoldTitle>AWS Marketplace Setup</ScaffoldTitle>
      </ScaffoldHeader>
      <ScaffoldDivider />
      {!isOrganizationsFetched || !isContractLinkingEligibilityFetched ? (
        <AwsMarketplaceOnboardingPlaceholder />
      ) : (
        wasOrganizationsRequestSuccessful &&
        wasEligibilityRequestSuccessful &&
        (contractLinkingEligibility?.eligibility.is_eligible ? (
          // If the contract is linkable and there are existing organizations
          organizations?.length ? (
            <AwsMarketplaceLinkExistingOrg organizations={organizations} />
          ) : (
            // If the contract is linkable and there are no existing organizations
            <AwsMarketplaceCreateNewOrg />
          )
        ) : (
          // If the contract is not eligible for linking
          <AwsMarketplaceContractNotLinkable eligibility={contractLinkingEligibility} />
        ))
      )}
    </ScaffoldContainer>
  )
}

AwsMarketplaceOnboarding.getLayout = (page) => (
  <LinkAwsMarketplaceLayout>{page}</LinkAwsMarketplaceLayout>
)

export default AwsMarketplaceOnboarding
