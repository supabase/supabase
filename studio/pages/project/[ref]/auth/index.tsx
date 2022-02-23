import { NextPage } from 'next'
import { observer } from 'mobx-react-lite'

import { withAuth } from 'hooks'
import { AuthLayout } from 'components/layouts'

const Authentication: NextPage = () => {
  return (
    <AuthLayout title="Authentication">
      <>{/* <h1>Use this as a template for authentication pages</h1> */}</>
    </AuthLayout>
  )
}

export default withAuth(observer(Authentication))
