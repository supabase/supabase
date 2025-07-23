import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { StoragePolicies } from 'components/interfaces/Storage'
import type { NextPageWithLayout } from 'types'

const StoragePoliciesPage: NextPageWithLayout = () => {
  return (
    <div className="storage-container flex flex-grow p-4">
      <StoragePolicies />
    </div>
  )
}

StoragePoliciesPage.getLayout = (page) => (
  <DefaultLayout>
    <StorageLayout title="Policies">{page}</StorageLayout>
  </DefaultLayout>
)

export default StoragePoliciesPage
