import { UserActivity } from '@/components/interfaces/Observability/UserActivity/UserActivity'
import { ReportPadding } from '@/components/interfaces/Reports/ReportPadding'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import ObservabilityLayout from '@/components/layouts/ObservabilityLayout/ObservabilityLayout'
import type { NextPageWithLayout } from '@/types'

const UserActivityPage: NextPageWithLayout = () => (
  <ReportPadding>
    <UserActivity />
  </ReportPadding>
)

UserActivityPage.getLayout = (page) => (
  <DefaultLayout>
    <ObservabilityLayout title="User Activity">{page}</ObservabilityLayout>
  </DefaultLayout>
)

export default UserActivityPage
