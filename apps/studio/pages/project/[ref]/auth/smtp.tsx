import { PermissionAction } from '@supabase/shared-types/out/constants'

import { SmtpForm } from 'components/interfaces/Auth'
import { AuthEmailsLayout } from 'components/layouts/AuthLayout/AuthEmailsLayout'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import NoPermission from 'components/ui/NoPermission'
import type { NextPageWithLayout } from 'types'

const SmtpPage: NextPageWithLayout = () => {
  const canReadAuthSettings = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')
  const isPermissionsLoaded = usePermissionsLoaded()

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's email settings" />
  }

  return <SmtpForm />
}

SmtpPage.getLayout = (page) => <AuthEmailsLayout>{page}</AuthEmailsLayout>

export default SmtpPage
