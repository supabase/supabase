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

StoragePoliciesPage.getLayout = (page) => <StorageLayout title="Policies">{page}</StorageLayout>

export default StoragePoliciesPage
