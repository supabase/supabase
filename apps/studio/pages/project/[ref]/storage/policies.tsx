import { StoragePolicies } from 'components/interfaces/Storage/StoragePolicies/StoragePolicies'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import type { NextPageWithLayout } from 'types'

const StoragePoliciesPage: NextPageWithLayout = () => {
  return <StoragePolicies />
}

StoragePoliciesPage.getLayout = (page) => (
  <DefaultLayout>
    <StorageLayout title="Policies">
      <PageLayout
        title="Storage policies"
        subtitle="Safeguard your files with policies that define the operations allowed for your users at the
        bucket level."
      >
        <ScaffoldContainer>{page}</ScaffoldContainer>
      </PageLayout>
    </StorageLayout>
  </DefaultLayout>
)

export default StoragePoliciesPage
