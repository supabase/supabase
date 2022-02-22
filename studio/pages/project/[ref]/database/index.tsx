import { useEffect } from 'react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'

import { withAuth } from 'hooks'
import { DatabaseLayout } from 'components/layouts'

const Database: NextPage = () => {
  const router = useRouter()

  useEffect(() => {
    router.push(`${router.asPath}/tables`)
  }, [])

  return (
    <DatabaseLayout title="Database">
      <>{/* <h1>Use this as a page template for database</h1> */}</>
    </DatabaseLayout>
  )
}

export default withAuth(observer(Database))
