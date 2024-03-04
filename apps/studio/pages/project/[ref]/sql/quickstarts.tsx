import { observer } from 'mobx-react-lite'
import type { NextPageWithLayout } from 'types'
import { SQLEditorLayout } from 'components/layouts'
import SQLQuickstarts from 'components/interfaces/SQLEditor/SQLTemplates/SQLQuickstarts'

const SqlEditorWelcome: NextPageWithLayout = () => {
  return <SQLQuickstarts />
}

SqlEditorWelcome.getLayout = (page) => <SQLEditorLayout title="Quickstarts">{page}</SQLEditorLayout>

export default observer(SqlEditorWelcome)
