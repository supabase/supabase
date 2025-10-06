import { StoragePolicies } from 'components/interfaces/Storage/StoragePolicies/StoragePolicies'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { StorageUILayout } from 'components/layouts/StorageLayout/StorageBucketsLayout'
import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import type { NextPageWithLayout } from 'types'

const FilesPoliciesPage: NextPageWithLayout = () => {
  return <StoragePolicies />
}

FilesPoliciesPage.getLayout = (page) => (
  <DefaultLayout>
    <StorageLayout title="Storage">
      <StorageUILayout>{page}</StorageUILayout>
    </StorageLayout>
  </DefaultLayout>
)

export default FilesPoliciesPage
