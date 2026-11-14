import Link from 'next/link'

import { ForgotPasswordWizard } from '@/components/interfaces/SignIn/ForgotPasswordWizard'
import { ForgotPasswordLayout } from '@/components/layouts/SignInLayout/ForgotPasswordLayout'
import { useHydratedQuery } from '@/hooks/misc/useHydratedQuery'
import type { NextPageWithLayout } from '@/types'

const ForgotPasswordPage: NextPageWithLayout = () => {
  const query = useHydratedQuery()

  return (
    <>
      <div className="flex flex-col gap-4">
        <ForgotPasswordWizard />
      </div>

      <div className="my-8 self-center text-sm">
        <span className="text-foreground-light">Already have an account?</span>{' '}
        <Link
          href={{ pathname: '/sign-in', query }}
          className="underline hover:text-foreground-light"
        >
          Sign in
        </Link>
      </div>
    </>
  )
}

ForgotPasswordPage.getLayout = (page) => (
  <ForgotPasswordLayout
    heading="Forgot your password?"
    subheading="Enter your email and we'll send you a code to reset the password"
  >
    {page}
  </ForgotPasswordLayout>
)

export default ForgotPasswordPage
