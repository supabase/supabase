import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { isUndefined } from 'lodash'

import { withAuth } from 'hooks'
import { SQLEditorLayout } from 'components/layouts'
import { SQLEditor } from 'components/interfaces'

// [Joshen] This is the mid re-written SQL which will replace index.tsx

const Sql: NextPage = () => {
  const router = useRouter()
  const { queryId, templateId } = router.query

  return (
    <SQLEditorLayout title="SQL">
      <SQLEditor
        queryId={!isUndefined(queryId) ? (queryId as string) : undefined}
        templateId={!isUndefined(templateId) ? Number(templateId) : undefined}
      />
    </SQLEditorLayout>
  )
}

export default withAuth(observer(Sql))
