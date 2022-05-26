import { Loading } from '@supabase/ui'
import { AuthProvidersForm } from 'components/interfaces'
import CommaSeperatedString from 'components/interfaces/Forms/CommaSeperatedString'
import { AuthLayout } from 'components/layouts'
import { AutoSchemaForm, FormHeader } from 'components/ui/Forms'
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

  if (!authConfig.isLoaded) {
    return <Loading active={true}>{''}</Loading>
  }

  if (authConfig)
    return (
      <div
        style={{ width: '820px' }}
        className="py-18 mx-auto mb-20 flex flex-col space-y-20 py-16"
      >
        <div>
          <FormHeader
            title="General settings"
            description={`URLs that auth providers are permitted to redirect to post authentication`}
          />
          <AutoSchemaForm />
        </div>

        <CommaSeperatedString />
        <AuthProvidersForm />
      </div>
    )
}

PageLayout.getLayout = (page) => {
  // console.log()
  return <AuthLayout>{page}</AuthLayout>
}

export default observer(PageLayout)
