import type { NextPageWithLayout } from 'types'

import { ReplicationSinks } from 'components/interfaces/Replication/Sinks'
import ReplicationLayout from 'components/layouts/ReplicationLayout/ReplicationLayout'

export const SinksPage: NextPageWithLayout = () => {
  return <ReplicationSinks />
}

SinksPage.getLayout = (page) => (
  <ReplicationLayout title="Replication Sinks">{page}</ReplicationLayout>
)

export default SinksPage
