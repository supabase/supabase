import type { NextPageWithLayout } from 'types'

import { ReplicationPipelines } from 'components/interfaces/Replication/Pipelines'
import ReplicationLayout from 'components/layouts/ReplicationLayout/ReplicationLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'

export const PipelinesPage: NextPageWithLayout = () => {
  return <ReplicationPipelines />
}

PipelinesPage.getLayout = (page) => (
  <DefaultLayout>
    <ReplicationLayout title="Replication Pipelines">{page}</ReplicationLayout>
  </DefaultLayout>
)

export default PipelinesPage
