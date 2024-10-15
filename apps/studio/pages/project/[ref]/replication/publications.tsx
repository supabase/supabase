import type { NextPageWithLayout } from 'types'

import ReplicationLayout from 'components/layouts/ReplicationLayout/ReplicationLayout'
import { ReplicationPublications } from 'components/interfaces/Replication/Publications'

export const PublicationsPage: NextPageWithLayout = () => {
  return <ReplicationPublications />
}

PublicationsPage.getLayout = (page) => (
  <ReplicationLayout title="Replication Publications">{page}</ReplicationLayout>
)

export default PublicationsPage
