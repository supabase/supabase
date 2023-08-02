import SQLAI from 'components/interfaces/SQLEditor/SQLTemplates/SQLAI'
import { SQLEditorLayout } from 'components/layouts'
import { observer } from 'mobx-react-lite'
import { NextPageWithLayout } from 'types'

const SqlEditorWelcome: NextPageWithLayout = () => {
  return <SQLAI />
}

SqlEditorWelcome.getLayout = (page) => (
  <SQLEditorLayout title="Build with AI">{page}</SQLEditorLayout>
)

export default observer(SqlEditorWelcome)
