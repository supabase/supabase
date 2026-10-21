import { ModelDashboard } from '@/components/interfaces/Model/ModelDashboard'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { ProjectLayoutWithAuth } from '@/components/layouts/ProjectLayout'
import type { NextPageWithLayout } from '@/types'

const ModelPage: NextPageWithLayout = () => <ModelDashboard />

ModelPage.getLayout = (page) => (
  <DefaultLayout>
    <ProjectLayoutWithAuth>{page}</ProjectLayoutWithAuth>
  </DefaultLayout>
)

export default ModelPage
