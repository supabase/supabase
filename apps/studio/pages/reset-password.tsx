import { ResetPasswordForm } from 'components/interfaces/SignIn/ResetPasswordForm'
import ForgotPasswordLayout from 'components/layouts/SignInLayout/ForgotPasswordLayout'
import { withAuth } from 'hooks/misc/withAuth'
import type { NextPageWithLayout } from 'types'

const ResetPasswordPage: NextPageWithLayout = () => {
  return (
    <div className="flex flex-col gap-4">
      <ResetPasswordForm />
    </div>
  )
}

ResetPasswordPage.getLayout = (page) => (
  <ForgotPasswordLayout
    heading="Change your password"
    subheading="Welcome back! Choose a new strong password and save it to proceed"
  >
    {page}
  </ForgotPasswordLayout>
)

export default withAuth(ResetPasswordPage)
