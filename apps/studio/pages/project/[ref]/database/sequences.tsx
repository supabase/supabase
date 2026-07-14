import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

import { Sequences } from '@/components/interfaces/Database/Sequences/Sequences'
import DatabaseLayout from '@/components/layouts/DatabaseLayout/DatabaseLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { DocsButton } from '@/components/ui/DocsButton'
import { DOCS_URL } from '@/lib/constants'
import type { NextPageWithLayout } from '@/types'

const SequencesPage: NextPageWithLayout = () => {
  return (
    <>
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Sequences</PageHeaderTitle>
            <PageHeaderDescription>
              Auto-incrementing number generators for your database
            </PageHeaderDescription>
          </PageHeaderSummary>
          <DocsButton className="no-underline" href={`${DOCS_URL}/guides/database/sequences`} />
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="large">
        <PageSection>
          <PageSectionContent>
            <Sequences />
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}

SequencesPage.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Sequences">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default SequencesPage
