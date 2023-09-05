import BranchManagement from 'components/interfaces/BranchManagement/BranchManagement'
import { ProjectLayoutWithAuth } from 'components/layouts'
import { NextPageWithLayout } from 'types'

const BranchManagementPage: NextPageWithLayout = () => {
  return <BranchManagement />
}

BranchManagementPage.getLayout = (page) => (
  <ProjectLayoutWithAuth>
    <main style={{ maxHeight: '100vh' }} className="flex-1 overflow-y-auto">
      {page}
    </main>
  </ProjectLayoutWithAuth>
)

export default BranchManagementPage
