import { ReportsV2 } from 'components/interfaces/ReportsV2/ReportsV2'
import ReportsLayout from 'components/layouts/ReportsLayout/ReportsLayout'
import type { NextPageWithLayout } from 'types'

export const ReportsV2Page: NextPageWithLayout = () => {
  return <ReportsV2 />
}

ReportsV2Page.getLayout = (page) => <ReportsLayout>{page}</ReportsLayout>

export default ReportsV2Page
