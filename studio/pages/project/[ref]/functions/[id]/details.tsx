import { observer } from 'mobx-react-lite'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { NextPageWithLayout } from 'types'
import { checkPermissions, useParams } from 'hooks'
import FunctionsLayout from 'components/layouts/FunctionsLayout'
import NoPermission from 'components/ui/NoPermission'
import { EdgeFunctionDetails } from 'components/interfaces/Functions'

const PageLayout: NextPageWithLayout = () => {
  const { id } = useParams()

  const canReadFunction = checkPermissions(PermissionAction.FUNCTIONS_READ, id as string)
  if (!canReadFunction) {
    return <NoPermission isFullPage resourceText="access this edge function's details" />
  }

  return <EdgeFunctionDetails />
}

PageLayout.getLayout = (page) => <FunctionsLayout>{page}</FunctionsLayout>

export default observer(PageLayout)
