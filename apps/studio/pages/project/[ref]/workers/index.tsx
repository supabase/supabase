import { useParams } from 'common'
import { useEffect, useState } from 'react'
import { Badge } from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

import { CreateWorkerDialog } from '@/components/interfaces/Workers/CreateWorkerDialog'
import { WorkersEmptyState } from '@/components/interfaces/Workers/WorkersEmptyState'
import { WorkersList } from '@/components/interfaces/Workers/WorkersList'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import WorkersLayout from '@/components/layouts/WorkersLayout/WorkersLayout'
import { ensureProjectSeeded, useProjectWorkers } from '@/state/workers-mock-state'
import type { NextPageWithLayout } from '@/types'

const WorkersPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    ensureProjectSeeded(ref)
  }, [ref])

  const workers = useProjectWorkers(ref)
  const hasWorkers = workers.length > 0

  return (
    <div className="w-full min-h-full flex flex-col items-stretch">
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>
              <span className="flex items-center gap-3">
                Workers
                <Badge variant="warning">Private Alpha</Badge>
              </span>
            </PageHeaderTitle>
            <PageHeaderDescription>
              Run managed compute in microVMs next to your database
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>

      <PageContainer size="large">
        <PageSection>
          <PageSectionContent>
            {hasWorkers ? (
              <WorkersList
                projectRef={ref as string}
                workers={workers}
                onCreate={() => setShowCreate(true)}
              />
            ) : (
              <WorkersEmptyState onCreate={() => setShowCreate(true)} />
            )}
          </PageSectionContent>
        </PageSection>
      </PageContainer>

      <CreateWorkerDialog open={showCreate} onOpenChange={setShowCreate} />
    </div>
  )
}

WorkersPage.getLayout = (page) => (
  <DefaultLayout>
    <WorkersLayout title="Workers">{page}</WorkersLayout>
  </DefaultLayout>
)

export default WorkersPage
