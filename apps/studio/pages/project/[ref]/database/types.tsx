import { EnumeratedTypes } from 'components/interfaces/Database/EnumeratedTypes/EnumeratedTypes'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import {
  ScaffoldContainer,
  ScaffoldSection,
  ScaffoldSectionContent,
} from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import type { NextPageWithLayout } from 'types'

const DatabaseEnumeratedTypes: NextPageWithLayout = () => {
  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <ScaffoldSectionContent className="!col-span-12">
          <FormHeader
            className="!mb-0"
            title="Database Enumerated Types"
            description="Custom data types that you can use in your database tables or functions"
          />
        </ScaffoldSectionContent>
        <div className="col-span-12 mt-3">
          <EnumeratedTypes />
        </div>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

DatabaseEnumeratedTypes.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default DatabaseEnumeratedTypes
