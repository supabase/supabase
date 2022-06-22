import { SQLEditorLayout } from 'components/layouts'
import { NextPageWithLayout } from 'types'

const SqlEditorPage: NextPageWithLayout = () => {
  return <div>Quick Query</div>
}

SqlEditorPage.getLayout = (page) => <SQLEditorLayout title="SQL">{page}</SQLEditorLayout>

export default SqlEditorPage
