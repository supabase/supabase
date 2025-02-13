import type { NextPageWithLayout } from 'types'

import ReplicationLayout from 'components/layouts/ReplicationLayout/ReplicationLayout'
import { ReplicationPublications } from 'components/interfaces/Replication/Publications'
import DefaultLayout from 'components/layouts/DefaultLayout'

export const PublicationsPage: NextPageWithLayout = () => {
  return <ReplicationPublications />
}

PublicationsPage.getLayout = (page) => (
  <DefaultLayout>
    <ReplicationLayout title="Replication Publications">{page}</ReplicationLayout>
  </DefaultLayout>
)

export default PublicationsPage
