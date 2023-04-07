import { observer } from 'mobx-react-lite'
import { NextPageWithLayout } from 'types'
import { SQLEditorLayout } from 'components/layouts'
import { SQLTemplates } from 'components/interfaces/SQLEditor'

const SqlEditorWelcome: NextPageWithLayout = () => {
  return <SQLTemplates />
}

SqlEditorWelcome.getLayout = (page) => <SQLEditorLayout title="SQL">{page}</SQLEditorLayout>

export default observer(SqlEditorWelcome)
