import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { NextPageWithLayout } from 'types'
import { checkPermissions } from 'hooks'
import NoPermission from 'components/ui/NoPermission'
import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'
import FunctionsLayout from 'components/layouts/FunctionsLayout'

export const LogPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref, id } = router.query

  const canReadFunction = checkPermissions(PermissionAction.FUNCTIONS_READ, id as string)
  if (!canReadFunction) {
    return <NoPermission isFullPage resourceText="access this edge function's logs" />
  }

  return (
    <LogsPreviewer
      projectRef={ref as string}
      queryType={'functions'}
      filterOverride={{ 'metadata.function_id': id }}
    />
  )
}

LogPage.getLayout = (page) => <FunctionsLayout>{page}</FunctionsLayout>

export default observer(LogPage)
