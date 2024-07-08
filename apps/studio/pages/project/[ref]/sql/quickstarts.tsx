import SQLQuickstarts from 'components/interfaces/SQLEditor/SQLTemplates/SQLQuickstarts'
import SQLEditorLayout from 'components/layouts/SQLEditorLayout/SQLEditorLayout'
import type { NextPageWithLayout } from 'types'

const SqlEditorWelcome: NextPageWithLayout = () => {
  return <SQLQuickstarts />
}

SqlEditorWelcome.getLayout = (page) => <SQLEditorLayout title="Quickstarts">{page}</SQLEditorLayout>

export default SqlEditorWelcome
