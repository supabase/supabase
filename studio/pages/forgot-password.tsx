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

      <div className="my-8 self-center text-sm">
        <span className="text-foreground-light">Already have an account?</span>{' '}
        <Link href="/sign-in" className="underline hover:text-foreground-light">
          Sign In
        </Link>
      </div>
    </>
  )
}

ForgotPasswordPage.getLayout = (page) => (
  <ForgotPasswordLayout
    heading="Reset Your Password"
    subheading="Type in your email and we'll send you a link to reset your password"
  >
    {page}
  </ForgotPasswordLayout>
)

export default ForgotPasswordPage
