import Reports from 'components/interfaces/Reports/Reports'
import { ReportsLayout } from 'components/layouts'
import EditReportModal from 'components/to-be-cleaned/Reports/EditReportModal'
import { observer } from 'mobx-react-lite'
import { NextPageWithLayout } from 'types'

const PageLayout: NextPageWithLayout = () => (
  <>
    <div className="1xl:px-28 mx-auto flex flex-col gap-4 px-5 py-6 lg:px-16 xl:px-24 2xl:px-32">
      <Reports />
    </div>
    <EditReportModal />
  </>
)

PageLayout.getLayout = (page) => <ReportsLayout>{page}</ReportsLayout>

export default observer(PageLayout)
