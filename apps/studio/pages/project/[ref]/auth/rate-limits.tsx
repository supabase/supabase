import { PermissionAction } from '@supabase/shared-types/out/constants'

import RateLimits from 'components/interfaces/Auth/RateLimits/RateLimits'
import { AuthLayout } from 'components/layouts'
import { FormsContainer } from 'components/ui/Forms'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions } from 'hooks'
import { NextPageWithLayout } from 'types'

const PageLayout: NextPageWithLayout = () => {
  const canReadAuthSettings = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')

  if (!canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's auth rate limit settings" />
  } else {
    return (
      <FormsContainer>
        <RateLimits />
      </FormsContainer>
    )
  }
}

PageLayout.getLayout = (page) => {
  return <AuthLayout>{page}</AuthLayout>
}

export default PageLayout
