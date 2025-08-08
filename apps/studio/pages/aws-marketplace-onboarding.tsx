import { NextPageWithLayout } from '../types'
import {
  ScaffoldContainer,
  ScaffoldDivider,
  ScaffoldHeader,
  ScaffoldTitle,
} from '../components/layouts/Scaffold'
import LinkAwsMarketplaceLayout from '../components/layouts/LinkAwsMarketplaceLayout'
import { useOrganizationsQuery } from '../data/organizations/organizations-query'
import AwsMarketplaceLinkExistingOrg from '../components/interfaces/Organization/CloudMarketplace/AwsMarketplaceLinkExistingOrg'
import AwsMarketplaceCreateNewOrg from '../components/interfaces/Organization/CloudMarketplace/AwsMarketplaceCreateNewOrg'
import { useCloudMarketplaceOnboardingInfoQuery } from '../components/interfaces/Organization/CloudMarketplace/cloud-marketplace-query'
import { useRouter } from 'next/router'
import AwsMarketplaceOnboardingPlaceholder from '../components/interfaces/Organization/CloudMarketplace/AwsMarketplaceOnboardingPlaceholder'

const AwsMarketplaceOnboarding: NextPageWithLayout = () => {
  const {
    query: { buyer_id: buyerId },
  } = useRouter()

  const { data: organizations, isFetched: isOrganizationsFetched } = useOrganizationsQuery()
  const { data: onboardingInfo, isLoading: isLoadingOnboardingInfo } =
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
