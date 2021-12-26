import { NextPage } from 'next'
import { observer } from 'mobx-react-lite'

import { withAuth } from 'hooks'
import { SQLEditorLayout } from 'components/layouts'
import { SQLTemplates } from 'components/interfaces/SQLEditor'

const SqlTemplates: NextPage = () => {
  return (
    <SQLEditorLayout title="SQL">
      <SQLTemplates />
    </SQLEditorLayout>
  )
}

export default withAuth(observer(SqlTemplates))
