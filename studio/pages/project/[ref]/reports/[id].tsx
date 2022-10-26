import { observer } from 'mobx-react-lite'
import { NextPageWithLayout } from 'types'
import { ProjectLayoutWithAuth } from 'components/layouts'
import EditReportModal from 'components/to-be-cleaned/Reports/EditReportModal'
import Reports from 'components/interfaces/Reports/Reports'
import ReportsLayout from 'components/layouts/ReportsLayout/ReportsLayout'

const PageLayout: NextPageWithLayout = () => (
  <>
    <div className="mx-auto my-8 w-full max-w-7xl h-full">
      <Reports />
    </div>
    <EditReportModal />
  </>
)

PageLayout.getLayout = (page) => <ReportsLayout>{page}</ReportsLayout>

export default observer(PageLayout)
