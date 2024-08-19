import SQLTemplates from 'components/interfaces/SQLEditor/SQLTemplates/SQLTemplates'
import SQLEditorLayout from 'components/layouts/SQLEditorLayout/SQLEditorLayout'
import type { NextPageWithLayout } from 'types'

const SqlEditorWelcome: NextPageWithLayout = () => {
  return <SQLTemplates />
}

SqlEditorWelcome.getLayout = (page) => <SQLEditorLayout title="SQL">{page}</SQLEditorLayout>

export default SqlEditorWelcome
