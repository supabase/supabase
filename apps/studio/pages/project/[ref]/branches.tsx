import BranchManagement from 'components/interfaces/BranchManagement/BranchManagement'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout/ProjectLayout'
import type { NextPageWithLayout } from 'types'

const BranchManagementPage: NextPageWithLayout = () => {
  return <BranchManagement />
}

BranchManagementPage.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout product="Branches">
      <ProjectLayoutWithAuth>{page}</ProjectLayoutWithAuth>
    </DefaultLayout>
  </AppLayout>
)

export default BranchManagementPage
