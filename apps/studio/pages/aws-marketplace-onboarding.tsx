import { useRouter } from 'next/router'

import type { NextPageWithLayout } from 'types'
import AwsMarketplaceCreateNewOrg from '../components/interfaces/Organization/CloudMarketplace/AwsMarketplaceCreateNewOrg'
import { AwsMarketplaceLinkExistingOrg } from '../components/interfaces/Organization/CloudMarketplace/AwsMarketplaceLinkExistingOrg'
import AwsMarketplaceOnboardingPlaceholder from '../components/interfaces/Organization/CloudMarketplace/AwsMarketplaceOnboardingPlaceholder'
import { useCloudMarketplaceOnboardingInfoQuery } from '../components/interfaces/Organization/CloudMarketplace/cloud-marketplace-query'
import LinkAwsMarketplaceLayout from '../components/layouts/LinkAwsMarketplaceLayout'
import {
  ScaffoldContainer,
  ScaffoldDivider,
  ScaffoldHeader,
  ScaffoldTitle,
} from '../components/layouts/Scaffold'
import { useOrganizationsQuery } from '../data/organizations/organizations-query'

const AwsMarketplaceOnboarding: NextPageWithLayout = () => {
  const {
    query: { buyer_id: buyerId },
  } = useRouter()

  const { data: organizations, isFetched: isOrganizationsFetched } = useOrganizationsQuery()
  const { data: onboardingInfo, isPending: isLoadingOnboardingInfo } =
    useCloudMarketplaceOnboardingInfoQuery({
      buyerId: buyerId as string,
    })

  return (
    <ScaffoldContainer>
      <ScaffoldHeader>
        <ScaffoldTitle>AWS Marketplace Setup</ScaffoldTitle>
      </ScaffoldHeader>
      <ScaffoldDivider />
      {!isOrganizationsFetched ? (
        <AwsMarketplaceOnboardingPlaceholder />
      ) : organizations?.length ? (
        <AwsMarketplaceLinkExistingOrg
          organizations={organizations}
          onboardingInfo={onboardingInfo}
          isLoadingOnboardingInfo={isLoadingOnboardingInfo}
        />
      ) : (
        <AwsMarketplaceCreateNewOrg onboardingInfo={onboardingInfo} />
      )}
    </ScaffoldContainer>
  )
}

AwsMarketplaceOnboarding.getLayout = (page) => (
  <LinkAwsMarketplaceLayout>{page}</LinkAwsMarketplaceLayout>
)

export default AwsMarketplaceOnboarding
