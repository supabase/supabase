import React, { useEffect } from 'react'
import { observer } from 'mobx-react-lite'

import { useStore } from 'hooks'
import { NextPageWithLayout } from 'types'
import { AuthLayout } from 'components/layouts'
import { FormsContainer } from 'components/ui/Forms'
import { AuthProvidersForm } from 'components/interfaces'
import RedirectDomains from 'components/interfaces/Auth/RedirectDomains/RedirectDomains'
import AutoSchemaForm from 'components/interfaces/Auth/AutoSchemaForm'

const PageLayout: NextPageWithLayout = () => {
  const { ui, authConfig } = useStore()

  useEffect(() => {
    authConfig.load()
  }, [ui.selectedProjectRef])

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
