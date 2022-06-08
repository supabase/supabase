import { observer } from 'mobx-react-lite'
import { DatabaseLayout } from 'components/layouts'
import { NextPageWithLayout } from 'types'

const Database: NextPageWithLayout = () => {
  return <>{/* <h1>Use this as a page template for database</h1> */}</>
}

Database.getLayout = (page) => <DatabaseLayout title="Database">{page}</DatabaseLayout>

export default observer(Database)
