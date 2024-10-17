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

const DatabaseEnumeratedTypes: NextPageWithLayout = () => {
  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <ScaffoldSectionContent>
          <FormHeader
            className="!mb-0"
            title="Database Enumerated Types"
            description="Custom data types that you can use in your database tables or functions."
          />
        </ScaffoldSectionContent>
        <ScaffoldSectionDetail className="flex items-center justify-end">
          <Button asChild type="default" icon={<ExternalLink strokeWidth={1.5} />}>
            <a
              target="_blank"
              rel="noreferrer"
              className="no-underline"
              href="https://www.postgresql.org/docs/current/datatype-enum.html"
            >
              Documentation
            </a>
          </Button>
        </ScaffoldSectionDetail>
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
