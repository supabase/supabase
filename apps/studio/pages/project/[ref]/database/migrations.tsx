import Migrations from 'components/interfaces/Database/Migrations/Migrations'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import {
  ScaffoldContainer,
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import { DocsButton } from 'components/ui/DocsButton'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { DOCS_URL } from 'lib/constants'
import type { NextPageWithLayout } from 'types'

const MigrationsPage: NextPageWithLayout = () => {
  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <ScaffoldSectionContent>
          <FormHeader
            className="!mb-0"
            title="Database Migrations"
            description="History of migrations that have been run on your database"
          />
        </ScaffoldSectionContent>
        <ScaffoldSectionDetail className="flex items-center md:justify-end gap-x-2">
          <DocsButton
            className="no-underline"
            href={`${DOCS_URL}/guides/deployment/database-migrations`}
          />
        </ScaffoldSectionDetail>
        <div className="col-span-12 mt-3">
          <Migrations />
        </div>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

MigrationsPage.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Migrations">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default MigrationsPage
