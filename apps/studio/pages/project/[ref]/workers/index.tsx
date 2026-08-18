import { useParams } from 'common'
import { useEffect } from 'react'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

import { WorkersList } from '@/components/interfaces/Workers/WorkersList'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import WorkersLayout from '@/components/layouts/WorkersLayout/WorkersLayout'
import { PRODUCT_NAME } from '@/lib/constants/workers'
import { ensureProjectSeeded, useProjectWorkers } from '@/state/workers-mock-state'
import type { NextPageWithLayout } from '@/types'

const WorkersPage: NextPageWithLayout = () => {
  const { ref } = useParams()

  useEffect(() => {
    ensureProjectSeeded(ref)
  }, [ref])

  const workers = useProjectWorkers(ref)

  return (
    <div className="w-full min-h-full flex flex-col items-stretch">
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>{PRODUCT_NAME}</PageHeaderTitle>
            <PageHeaderDescription>
              Run backend workers in microVMs next to your database
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>

      <PageContainer size="large">
        <PageSection>
          <PageSectionContent>
            {workers.length === 0 && (
              <p className="text-sm text-foreground-light">
                No workers yet. Deploy your first worker with the Supabase CLI.
              </p>
            )}
            {workers.length > 0 && <WorkersList projectRef={ref as string} workers={workers} />}
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </div>
  )
}

WorkersPage.getLayout = (page) => (
  <DefaultLayout>
    <WorkersLayout title={PRODUCT_NAME}>{page}</WorkersLayout>
  </DefaultLayout>
)

export default WorkersPage
