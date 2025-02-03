import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import { StoragePolicies } from 'components/to-be-cleaned/Storage'
import type { NextPageWithLayout } from 'types'

const StoragePoliciesPage: NextPageWithLayout = () => {
  return (
    <div className="storage-container flex flex-grow p-4">
      <StoragePolicies />
    </div>
  )
}

StoragePoliciesPage.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout product="Storage Policies">
      <StorageLayout title="Policies">{page}</StorageLayout>
    </DefaultLayout>
  </AppLayout>
)

export default StoragePoliciesPage
