import ForgotPasswordForm from 'components/interfaces/Login/ForgotPasswordForm'
import { LoginLayout } from 'components/layouts'
import Link from 'next/link'
import { NextPageWithLayout } from 'types'

const ForgotPasswordPage: NextPageWithLayout = () => {
  return (
    <>
      <div className="flex flex-col gap-4">
        <ForgotPasswordForm />
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

ForgotPasswordPage.getLayout = (page) => (
  <LoginLayout title="Forgot Password" showDisclaimer={false}>
    {page}
  </LoginLayout>
)

export default ForgotPasswordPage
