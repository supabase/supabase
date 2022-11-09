import ResetPasswordForm from 'components/interfaces/SignIn/ResetPasswordForm'
import { ForgotPasswordLayout } from 'components/layouts'
import { withAuth } from 'hooks'
import Link from 'next/link'
import { NextPageWithLayout } from 'types'

const ResetPasswordPage: NextPageWithLayout = () => {
  return (
    <>
      <div className="flex flex-col gap-4">
        <ResetPasswordForm />
      </div>

      <div className="my-8 self-center text-sm">
        <span className="text-scale-1100">Already have an account?</span>{' '}
        <Link href="/sign-in">
          <a className="underline hover:text-scale-1100">Sign In</a>
        </Link>
      </div>
    </>
  )
}

ResetPasswordPage.getLayout = (page) => (
  <ForgotPasswordLayout
    heading="Reset Your Password"
    subheading="Type in a new secure password and press save to update your password"
  >
    {page}
  </ForgotPasswordLayout>
)

export default withAuth(ResetPasswordPage)
