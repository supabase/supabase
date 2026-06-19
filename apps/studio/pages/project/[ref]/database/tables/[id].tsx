import { TableDetailPageContent } from '@/components/interfaces/Database/Tables/TableDetailPageContent'
import DatabaseLayout from '@/components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from '@/components/layouts/DefaultLayout'
import type { NextPageWithLayout } from '@/types'

const DatabaseTableDetailPage: NextPageWithLayout = () => {
  return <TableDetailPageContent />
}

DatabaseTableDetailPage.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Tables">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default DatabaseTableDetailPage
