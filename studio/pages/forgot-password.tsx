import ForgotPasswordForm from 'components/interfaces/SignIn/ForgotPasswordForm'
import { ForgotPasswordLayout } from 'components/layouts'
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
        <Link href="/sign-in">
          <a className="underline hover:text-scale-1100">Sign In</a>
        </Link>
      </div>
    </>
  )
}

ForgotPasswordPage.getLayout = (page) => (
  <ForgotPasswordLayout title="Forgot Password" showDisclaimer={false}>
    {page}
  </ForgotPasswordLayout>
)

export default ForgotPasswordPage
