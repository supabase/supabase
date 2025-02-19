import SQLTemplates from 'components/interfaces/SQLEditor/SQLTemplates/SQLTemplates'
import DefaultLayout from 'components/layouts/DefaultLayout'
import SQLEditorLayout from 'components/layouts/SQLEditorLayout/SQLEditorLayout'
import type { NextPageWithLayout } from 'types'

const SqlEditorWelcome: NextPageWithLayout = () => {
  return <SQLTemplates />
}

SqlEditorWelcome.getLayout = (page) => (
  <DefaultLayout>
    <SQLEditorLayout title="SQL">{page}</SQLEditorLayout>
  </DefaultLayout>
)

export default SqlEditorWelcome
