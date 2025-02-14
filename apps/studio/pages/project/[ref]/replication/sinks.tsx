import type { NextPageWithLayout } from 'types'

import { ReplicationSinks } from 'components/interfaces/Replication/Sinks'
import ReplicationLayout from 'components/layouts/ReplicationLayout/ReplicationLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'

export const SinksPage: NextPageWithLayout = () => {
  return <ReplicationSinks />
}

SinksPage.getLayout = (page) => (
  <DefaultLayout>
    <ReplicationLayout title="Replication Sinks">{page}</ReplicationLayout>
  </DefaultLayout>
)

export default SinksPage
