import SQLQuickstarts from 'components/interfaces/SQLEditor/SQLTemplates/SQLQuickstarts'
import DefaultLayout from 'components/layouts/DefaultLayout'
import SQLEditorLayout from 'components/layouts/SQLEditorLayout/SQLEditorLayout'
import type { NextPageWithLayout } from 'types'

const SqlEditorWelcome: NextPageWithLayout = () => {
  return <SQLQuickstarts />
}

SqlEditorWelcome.getLayout = (page) => (
  <DefaultLayout>
    <SQLEditorLayout title="Quickstarts">{page}</SQLEditorLayout>
  </DefaultLayout>
)

export default SqlEditorWelcome
