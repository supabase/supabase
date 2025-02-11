import BranchManagement from 'components/interfaces/BranchManagement/BranchManagement'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout/ProjectLayout'
import type { NextPageWithLayout } from 'types'

const BranchManagementPage: NextPageWithLayout = () => {
  return <BranchManagement />
}

BranchManagementPage.getLayout = (page) => <ProjectLayoutWithAuth>{page}</ProjectLayoutWithAuth>

export default BranchManagementPage
