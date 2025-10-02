import { StoragePolicies } from 'components/interfaces/Storage/StoragePolicies/StoragePolicies'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { StorageFilesLayout } from 'components/layouts/StorageLayout/StorageFilesLayout'
import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import type { NextPageWithLayout } from 'types'

const FilesPoliciesPage: NextPageWithLayout = () => {
  return <StoragePolicies />
}

FilesPoliciesPage.getLayout = (page) => (
  <DefaultLayout>
    <StorageLayout title="Storage">
      <StorageFilesLayout>{page}</StorageFilesLayout>
    </StorageLayout>
  </DefaultLayout>
)

export default FilesPoliciesPage
