import { EnumeratedTypesPage } from 'components/interfaces/Database'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import type { NextPageWithLayout } from 'types'

const DatabaseEnumeratedTypes: NextPageWithLayout = () => {
  return <EnumeratedTypesPage />
}

DatabaseEnumeratedTypes.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default DatabaseEnumeratedTypes
