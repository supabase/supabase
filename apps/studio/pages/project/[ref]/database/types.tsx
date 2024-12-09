import { ExternalLink } from 'lucide-react'

import { EnumeratedTypes } from 'components/interfaces/Database'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import {
  ScaffoldContainer,
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import type { NextPageWithLayout } from 'types'
import { Button } from 'ui'
import { DocsButton } from 'components/ui/DocsButton'

const DatabaseEnumeratedTypes: NextPageWithLayout = () => {
  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <ScaffoldSectionContent className="!col-span-12">
          <FormHeader
            className="!mb-0"
            title="Database Enumerated Types"
            description="Custom data types that you can use in your database tables or functions."
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
  <DatabaseLayout title="Database">{page}</DatabaseLayout>
)

export default DatabaseEnumeratedTypes
