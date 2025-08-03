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

const LinkAwsMarketplace: NextPageWithLayout = () => {
  const existingOrgs = false
  const { data: organizations, isLoading: isLoadingOrganizations } = useOrganizationsQuery()

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
        />
      ) : (
        <AwsMarketplaceCreateNewOrg />
      )}
    </ScaffoldContainer>
  )
}

LinkAwsMarketplace.getLayout = (page) => <LinkAwsMarketplaceLayout>{page}</LinkAwsMarketplaceLayout>

export default LinkAwsMarketplace
