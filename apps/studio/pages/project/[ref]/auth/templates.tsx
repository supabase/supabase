import { PermissionAction } from '@supabase/shared-types/out/constants'
import { EmailTemplates } from 'components/interfaces/Auth'
import { AuthEmailsLayout } from 'components/layouts/AuthLayout/AuthEmailsLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from 'types'

const TemplatesPage: NextPageWithLayout = () => {
  const canReadAuthSettings = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')
  const isPermissionsLoaded = usePermissionsLoaded()

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's email settings" />
  }

  return (
    <ScaffoldContainer>
      <EmailTemplates />
    </ScaffoldContainer>
  )
}

TemplatesPage.getLayout = (page) => <AuthEmailsLayout>{page}</AuthEmailsLayout>

export default TemplatesPage
