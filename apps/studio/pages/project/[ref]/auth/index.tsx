import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import type { NextPageWithLayout } from 'types'

const Authentication: NextPageWithLayout = () => {
  return <>{/* <h1>Use this as a template for authentication pages</h1> */}</>
}

Authentication.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>{page}</AuthLayout>
  </DefaultLayout>
)

export default Authentication
