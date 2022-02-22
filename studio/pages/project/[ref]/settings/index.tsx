import { useEffect } from 'react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'

import { withAuth } from 'hooks'
import { SettingsLayout } from 'components/layouts'

const Settings: NextPage = () => {
  const router = useRouter()

  useEffect(() => {
    router.push(`${router.asPath}/general`)
  }, [])

  return (
    <SettingsLayout>
      <>{/* <h1>Use this as a page template for settings pages</h1> */}</>
    </SettingsLayout>
  )
}

export default withAuth(observer(Settings))
