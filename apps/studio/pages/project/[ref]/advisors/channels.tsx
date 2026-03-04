import AdvisorsLayout from 'components/layouts/AdvisorsLayout/AdvisorsLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ChannelsList } from 'components/interfaces/Advisors/Channels/ChannelsList'
import type { NextPageWithLayout } from 'types'

const AdvisorChannelsPage: NextPageWithLayout = () => {
  return (
    <div className="mx-auto w-full max-w-7xl flex flex-col gap-y-8 px-5 py-6">
      <ChannelsList />
    </div>
  )
}

AdvisorChannelsPage.getLayout = (page) => (
  <DefaultLayout>
    <AdvisorsLayout title="Notification Channels">{page}</AdvisorsLayout>
  </DefaultLayout>
)

export default AdvisorChannelsPage
