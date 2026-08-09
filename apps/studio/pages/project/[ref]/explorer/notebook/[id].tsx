import { NotebookEditor } from '@/components/interfaces/Explorer/NotebookEditor'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { ExplorerLayout } from '@/components/layouts/ExplorerLayout/ExplorerLayout'
import type { NextPageWithLayout } from '@/types'

const NotebookPage: NextPageWithLayout = () => {
  return <NotebookEditor />
}

NotebookPage.getLayout = (page) => (
  <DefaultLayout>
    <ExplorerLayout>{page}</ExplorerLayout>
  </DefaultLayout>
)

export default NotebookPage
