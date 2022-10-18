import ResetPasswordForm from 'components/interfaces/Login/ResetPasswordForm'
import { ForgotPasswordLayout } from 'components/layouts'
import Link from 'next/link'
import { NextPageWithLayout } from 'types'

const ResetPasswordPage: NextPageWithLayout = () => {
  return (
    <>
      <div className="flex flex-col gap-4">
        <ResetPasswordForm />
      </div>

      <div className="w-full border-t border-scale-700 my-4" />

      <div className="mb-4">
        <span className="text-scale-1000">Already have an account?</span>{' '}
        <Link href="/">
          <a className="underline hover:text-scale-1100">Login</a>
        </Link>
      </div>
    </>
  )
}

ResetPasswordPage.getLayout = (page) => (
  <ForgotPasswordLayout title="Reset Password" showDisclaimer={false}>
    {page}
  </ForgotPasswordLayout>
)

export default ResetPasswordPage
