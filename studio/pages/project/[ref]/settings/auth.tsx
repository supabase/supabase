import { PermissionAction } from '@supabase/shared-types/out/constants'
import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'

import { useParams } from 'common'
import { AutoSchemaForm, SmtpForm } from 'components/interfaces/Auth'
import { SettingsLayout } from 'components/layouts'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions, useStore } from 'hooks'
import { NextPageWithLayout } from 'types'

const PageLayout: NextPageWithLayout = () => {
  const { authConfig } = useStore()
  const { ref: projectRef } = useParams()

  useEffect(() => {
    authConfig.load()
  }, [projectRef])

  const canReadAuthSettings = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')

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
