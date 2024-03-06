import Reports from 'components/interfaces/Reports/Reports'
import { ReportsLayout } from 'components/layouts'
import EditReportModal from 'components/to-be-cleaned/Reports/EditReportModal'
import type { NextPageWithLayout } from 'types'

const PageLayout: NextPageWithLayout = () => (
  <>
    <div className="mx-auto flex flex-col gap-4 p-3">
      <Reports />
    </div>
    <EditReportModal />
  </>
)

PageLayout.getLayout = (page) => <ReportsLayout>{page}</ReportsLayout>

export default PageLayout
