import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import type { NextPageWithLayout } from 'types'

const Storage: NextPageWithLayout = () => {
  return <>{/* <h1>Use this as a template for storage pages</h1> */}</>
}

Storage.getLayout = (page) => <StorageLayout title="Storage">{page}</StorageLayout>

export default Storage
