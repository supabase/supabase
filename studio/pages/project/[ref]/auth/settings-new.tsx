import { AuthProvidersForm } from 'components/interfaces'
import RedirectDomains from 'components/interfaces/Auth/RedirectDomains'
import { AuthLayout } from 'components/layouts'
import { AutoSchemaForm, FormsContainer } from 'components/ui/Forms'
import { useStore } from 'hooks'
import { observer } from 'mobx-react-lite'
import React, { useEffect } from 'react'
import { NextPageWithLayout } from 'types'

const PageLayout: NextPageWithLayout = () => {
  const { ui, authConfig } = useStore()

  useEffect(() => {
    // temporary store loader
    authConfig.load()
  }, [ui.selectedProjectRef])

  if (authConfig)
    return (
      <FormsContainer>
        <AutoSchemaForm />
        <RedirectDomains />
        <AuthProvidersForm />
      </FormsContainer>
    )
}

PageLayout.getLayout = (page) => {
  return <AuthLayout>{page}</AuthLayout>
}

export default observer(PageLayout)
