import { NextPageWithLayout } from 'types'
import DefaultLayout from 'components/layouts/DefaultLayout'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'

const AuthOverview: NextPageWithLayout = () => {
  return (
    <ScaffoldContainer>
      <ScaffoldSection>Overview</ScaffoldSection>
    </ScaffoldContainer>
  )
}

AuthOverview.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>{page}</AuthLayout>
  </DefaultLayout>
)

export default AuthOverview
