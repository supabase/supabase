import BranchManagement from 'components/interfaces/BranchManagement/BranchManagement'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout/ProjectLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import type { NextPageWithLayout } from 'types'

const BranchManagementPage: NextPageWithLayout = () => {
  return <BranchManagement />
}

BranchManagementPage.getLayout = (page) => (
  <DefaultLayout>
    <ProjectLayoutWithAuth>{page}</ProjectLayoutWithAuth>
  </DefaultLayout>
)

export default BranchManagementPage
