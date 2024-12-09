import { ExternalLink } from 'lucide-react'

import Migrations from 'components/interfaces/Database/Migrations/Migrations'
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
        <ScaffoldSectionDetail className="flex items-center justify-end gap-x-2">
          <DocsButton
            className="no-underline"
            href="https://supabase.com/docs/guides/deployment/database-migrations"
          />
        </ScaffoldSectionDetail>
        <div className="col-span-12 mt-3">
          <Migrations />
        </div>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

MigrationsPage.getLayout = (page) => <DatabaseLayout title="Migrations">{page}</DatabaseLayout>

export default MigrationsPage
