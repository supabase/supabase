import type { NextPageWithLayout } from 'types'

import { ReplicationPipelines } from 'components/interfaces/Replication/Pipelines'
import ReplicationLayout from 'components/layouts/ReplicationLayout/ReplicationLayout'

export const PipelinesPage: NextPageWithLayout = () => {
  return <ReplicationPipelines />
}

PipelinesPage.getLayout = (page) => (
  <ReplicationLayout title="Replication Pipelines">{page}</ReplicationLayout>
)

export default PipelinesPage
