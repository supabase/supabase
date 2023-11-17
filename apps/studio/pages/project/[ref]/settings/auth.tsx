import { PermissionAction } from '@supabase/shared-types/out/constants'

import {
  SmtpForm,
  BasicAuthSettingsForm,
  AdvancedAuthSettingsForm,
} from 'components/interfaces/Auth'
import { SettingsLayout } from 'components/layouts'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions } from 'hooks'
import { NextPageWithLayout } from 'types'

const PageLayout: NextPageWithLayout = () => {
  const canReadAuthSettings = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')

  if (!canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's authentication settings" />
  } else {
    return (
      <div className="1xl:px-28 mx-auto flex flex-col gap-8 px-5 py-6 lg:px-16 xl:px-24 2xl:px-32">
        <BasicAuthSettingsForm />
        <SmtpForm />
        <AdvancedAuthSettingsForm />
      </div>
    )
  }
}

PageLayout.getLayout = (page) => {
  return <SettingsLayout>{page}</SettingsLayout>
}

export default PageLayout
