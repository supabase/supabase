import { WorkerDetail } from '@/components/interfaces/Workers/WorkerDetail/WorkerDetail'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import WorkersLayout from '@/components/layouts/WorkersLayout/WorkersLayout'
import type { NextPageWithLayout } from '@/types'

const WorkerDetailPage: NextPageWithLayout = () => <WorkerDetail />

WorkerDetailPage.getLayout = (page) => (
  <DefaultLayout>
    <WorkersLayout title="Worker">{page}</WorkersLayout>
  </DefaultLayout>
)

export default WorkerDetailPage
