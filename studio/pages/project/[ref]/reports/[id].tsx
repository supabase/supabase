import { observer } from 'mobx-react-lite'
import { NextPageWithLayout } from 'types'
import { ProjectLayoutWithAuth } from 'components/layouts'
import EditReportModal from 'components/to-be-cleaned/Reports/EditReportModal'
import Reports from 'components/interfaces/Reports/Reports'

const PageLayout: NextPageWithLayout = () => (
  <>
    <div className="mx-auto my-8 w-full max-w-7xl h-full">
      <Reports />
    </div>
    <EditReportModal />
  </>
)

PageLayout.getLayout = (page) => <ProjectLayoutWithAuth>{page}</ProjectLayoutWithAuth>

export default observer(PageLayout)
