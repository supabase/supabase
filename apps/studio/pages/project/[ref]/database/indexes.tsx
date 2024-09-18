import { ExternalLink } from 'lucide-react'

import Indexes from 'components/interfaces/Database/Indexes/Indexes'
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

const IndexesPage: NextPageWithLayout = () => {
  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <ScaffoldSectionContent className="gap-0">
          <FormHeader
            className="!mb-0"
            title="Database Indexes"
            description="Improve query performance against your database"
          />
        </ScaffoldSectionContent>
        <ScaffoldSectionDetail className="flex items-center justify-end gap-2 flex-wrap">
          <Button asChild type="default" icon={<ExternalLink strokeWidth={1.5} />}>
            <a
              target="_blank"
              rel="noreferrer"
              className="no-underline"
              href="https://supabase.com/docs/guides/database/query-optimization"
            >
              Documentation
            </a>
          </Button>
          <Button asChild type="default" icon={<ExternalLink strokeWidth={1.5} />}>
            <a
              target="_blank"
              rel="noreferrer"
              className="no-underline"
              href="https://supabase.com/docs/guides/database/extensions/index_advisor"
            >
              Optimization with index_advisor
            </a>
          </Button>
        </ScaffoldSectionDetail>
        <div className="col-span-12 mt-3">
          <Indexes />
        </div>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

IndexesPage.getLayout = (page) => <DatabaseLayout title="Indexes">{page}</DatabaseLayout>

export default IndexesPage
