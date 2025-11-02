import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { StoragePolicies } from 'components/interfaces/Storage'
import type { NextPageWithLayout } from 'types'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'

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
