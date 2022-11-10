import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { NextPageWithLayout } from 'types'
import { checkPermissions, useStore } from 'hooks'
import { SettingsLayout } from 'components/layouts'
import NoPermission from 'components/ui/NoPermission'
import { SmtpForm, AutoSchemaForm } from 'components/interfaces/Auth'

const PageLayout: NextPageWithLayout = () => {
  const { ui, authConfig } = useStore()

  useEffect(() => {
    authConfig.load()
  }, [ui.selectedProjectRef])

  const canReadAuthSettings = checkPermissions(PermissionAction.READ, 'custom_config_gotrue')

  if (!canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's authentication settings" />
  } else if (authConfig) {
    return (
      <div className="1xl:px-28 mx-auto flex flex-col gap-8 px-5 py-6 lg:px-16 xl:px-24 2xl:px-32">
        <AutoSchemaForm />
        <SmtpForm />
      </div>
    )
  } else {
    return <div />
  }
}

PageLayout.getLayout = (page) => {
  return <SettingsLayout>{page}</SettingsLayout>
}

export default observer(PageLayout)
