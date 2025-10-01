import { StoragePolicies } from 'components/interfaces/Storage/StoragePolicies/StoragePolicies'
import { BucketTypeLayout } from 'components/layouts/StorageLayout/BucketLayout'
import type { NextPageWithLayout } from 'types'

const FilesPoliciesPage: NextPageWithLayout = () => {
  return <StoragePolicies />
}

FilesPoliciesPage.getLayout = (page) => <BucketTypeLayout isEmpty={false}>{page}</BucketTypeLayout>

export default FilesPoliciesPage
