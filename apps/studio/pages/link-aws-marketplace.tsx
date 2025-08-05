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

const LinkAwsMarketplace: NextPageWithLayout = () => {
  const existingOrgs = true

  const router = useRouter()
  const {
    query: { buyer_id: buyerId },
  } = router

  const { data: organizations, isLoading: isLoadingOrganizations } = useOrganizationsQuery()
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
      {existingOrgs ? (
        <AwsMarketplaceLinkExistingOrg
          organizations={organizations}
          isLoadingOrganizations={isLoadingOrganizations}
          onboardingInfo={onboardingInfo}
          isLoadingOnboardingInfo={isLoadingOnboardingInfo}
        />
      ) : (
        <AwsMarketplaceCreateNewOrg onboardingInfo={onboardingInfo} />
      )}
    </ScaffoldContainer>
  )
}

LinkAwsMarketplace.getLayout = (page) => <LinkAwsMarketplaceLayout>{page}</LinkAwsMarketplaceLayout>

export default LinkAwsMarketplace
