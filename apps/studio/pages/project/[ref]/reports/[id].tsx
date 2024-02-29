import Reports from 'components/interfaces/Reports/Reports'
import { ReportsLayout } from 'components/layouts'
import EditReportModal from 'components/to-be-cleaned/Reports/EditReportModal'
import { observer } from 'mobx-react-lite'
import { NextPageWithLayout } from 'types'

const PageLayout: NextPageWithLayout = () => (
  <>
    <div className="mx-auto flex flex-col gap-4 p-3">
      <Reports />
    </div>
    <EditReportModal />
  </>
)

PageLayout.getLayout = (page) => <ReportsLayout>{page}</ReportsLayout>

export default observer(PageLayout)
