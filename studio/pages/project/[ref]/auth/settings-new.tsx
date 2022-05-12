import { Loading } from '@supabase/ui'
import { AuthProvidersForm } from 'components/interfaces'
import { AuthLayout } from 'components/layouts'
import { AutoSchemaForm } from 'components/ui/Forms'
import { useStore, withAuth } from 'hooks'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import React from 'react'
import { useState } from 'react'
import { useEffect } from 'react'
import useSWR from 'swr'
import { NextPageWithLayout } from 'types'

// const Auth = () => {
//   return (
//     <AuthLayout title="Auth">
//       <div className="p-4">
//         <WholeForm />
//       </div>
//     </AuthLayout>
//   )
// }

const PageLayout: NextPageWithLayout = () => {
  const router = useRouter()
  const { ui, authConfig } = useStore()

  const URL = `${API_URL}/auth/${router.query.ref}/config`
  // const { data: config, error }: any = useSWR(URL, get)

  // console.log(authConfig)

  useEffect(() => {
    // temporary store loader
    authConfig.load()
  }, [ui.selectedProjectRef])

  const [model, setModel] = useState<any>({})
  const [isCustomSMTPEnabled, setCustomSMTP] = useState<boolean>(false)
  const [externalProvidersModel, setExternalProvidersModel] = useState<any>({})

  if (!authConfig.isLoaded) {
    return <Loading active={true}>{''}</Loading>
  }

  // if (error) {
  //   return (
  //     <span>
  //       <p>Error connecting to API</p>
  //       <p>{`${error}`}</p>
  //     </span>
  //   )
  // }

  // console.log(config)

  // useEffect(() => {
  //   if (config) {
  //     const temp =
  //       config.SMTP_ADMIN_EMAIL ||
  //       config.SMTP_HOST ||
  //       config.SMTP_PORT ||
  //       config.SMTP_USER ||
  //       config.SMTP_PASS
  //     setCustomSMTP(temp)
  //   }
  //   setModel({ ...config })
  //   setExternalProvidersModel({ ...config })
  // }, [config])

  if (authConfig)
    return (
      <div style={{ width: '820px' }} className="mx-auto">
        <div>
          <h3 className="text-scale-1200 mb-2 text-2xl">General settings</h3>
          <p className="text-scale-900 text-sm">
            Turn payment methods on and off in one click – no engineering time required.
          </p>
          <p className="text-scale-900 text-sm">
            Use our guide to check which payment methods are compatible with your integration.
          </p>
          <AutoSchemaForm />
        </div>

        <AuthProvidersForm />
      </div>
    )
}

PageLayout.getLayout = (page) => {
  // console.log()
  return <AuthLayout>{page}</AuthLayout>
}

export default observer(PageLayout)
