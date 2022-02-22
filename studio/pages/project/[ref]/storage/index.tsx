import { useEffect } from 'react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'

import { withAuth } from 'hooks'
import { StorageLayout } from 'components/layouts'

const Storage: NextPage = () => {
  const router = useRouter()

  useEffect(() => {
    router.push(`${router.asPath}/buckets`)
  }, [])

  return (
    <StorageLayout title="Storage">
      <>{/* <h1>Use this as a template for storage pages</h1> */}</>
    </StorageLayout>
  )
}

export default withAuth(observer(Storage))
