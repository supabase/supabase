import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import type { NextPageWithLayout } from 'types'

const Storage: NextPageWithLayout = () => {
  return <>{/* <h1>Use this as a template for storage pages</h1> */}</>
}

Storage.getLayout = (page) => (
  <DefaultLayout>
    <StorageLayout title="Storage">{page}</StorageLayout>
  </DefaultLayout>
)

export default Storage
