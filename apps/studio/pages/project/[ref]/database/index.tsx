import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import type { NextPageWithLayout } from 'types'

const Database: NextPageWithLayout = () => {
  return <>{/* <h1>Use this as a page template for database</h1> */}</>
}

Database.getLayout = (page) => <DatabaseLayout title="Database">{page}</DatabaseLayout>

export default Database
