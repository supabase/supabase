import { EnumeratedTypes } from 'components/interfaces/Database/EnumeratedTypes/EnumeratedTypes'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import type { NextPageWithLayout } from 'types'

const DatabaseEnumeratedTypes: NextPageWithLayout = () => {
  return (
    <ScaffoldContainer size="large">
      <ScaffoldSection isFullWidth>
        <EnumeratedTypes />
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

DatabaseEnumeratedTypes.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database">
      <PageLayout
        title="Database Enumerated Types"
        subtitle="Custom data types that you can use in your database tables or functions."
        size="large"
      >
        {page}
      </PageLayout>
    </DatabaseLayout>
  </DefaultLayout>
)

export default DatabaseEnumeratedTypes
