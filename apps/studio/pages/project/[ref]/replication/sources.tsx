import type { NextPageWithLayout } from 'types'

import { ReplicationSources } from 'components/interfaces/Replication/Sources'
import ReplicationLayout from 'components/layouts/ReplicationLayout/ReplicationLayout'

export const SourcesPage: NextPageWithLayout = () => {
  return <ReplicationSources />
}

SourcesPage.getLayout = (page) => (
  <ReplicationLayout title="Replication Sources">{page}</ReplicationLayout>
)

export default SourcesPage
