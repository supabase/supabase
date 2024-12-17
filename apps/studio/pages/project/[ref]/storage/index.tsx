import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import type { NextPageWithLayout } from 'types'

const Storage: NextPageWithLayout = () => {
  return <>{/* <h1>Use this as a template for storage pages</h1> */}</>
}

Storage.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout>
      <StorageLayout title="Storage">{page}</StorageLayout>
    </DefaultLayout>
  </AppLayout>
)

export default Storage
