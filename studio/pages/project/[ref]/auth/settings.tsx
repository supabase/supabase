import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'

import { PermissionAction } from '@supabase/shared-types/out/constants'
import { usePermissions, useStore } from 'hooks'
import { NextPageWithLayout } from 'types'

import { AuthProvidersForm } from 'components/interfaces'
import AutoSchemaForm from 'components/interfaces/Auth/AutoSchemaForm'
import RedirectDomains from 'components/interfaces/Auth/RedirectDomains/RedirectDomains'
import { AuthLayout } from 'components/layouts'
import { FormsContainer } from 'components/ui/Forms'

const PageLayout: NextPageWithLayout = () => {
  const { ui, authConfig } = useStore()

  useEffect(() => {
    authConfig.load()
  }, [ui.selectedProjectRef])

  const canUpdate = usePermissions(
    PermissionAction.SQL_UPDATE,
    'postgres.public.custom_config_gotrue'
  )

  if (authConfig) {
    return (
      <FormsContainer>
        <AutoSchemaForm />
        <RedirectDomains />
        <AuthProvidersForm />
      </FormsContainer>
    )
  } else {
    return <div />
  }
}

PageLayout.getLayout = (page) => {
  return <AuthLayout>{page}</AuthLayout>
}

export default observer(PageLayout)
