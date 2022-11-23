import SignInForm from 'components/interfaces/SignIn/SignInForm'
import SignInWithGitHub from 'components/interfaces/SignIn/SignInWithGitHub'
import { SignInLayout } from 'components/layouts'
import Link from 'next/link'
import { NextPageWithLayout } from 'types'

const SignInPage: NextPageWithLayout = () => {
  return (
    <>
      <div className="flex flex-col gap-5">
        <SignInWithGitHub />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-scale-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-scale-200 px-2 text-sm text-scale-1200">or</span>
          </div>
        </div>

        <SignInForm />
      </div>

      <div className="my-8 self-center text-sm">
        <div>
          <span className="text-scale-1000">Don't have an account?</span>{' '}
          <Link href="/sign-up">
            <a className="underline text-scale-1200 hover:text-scale-1100 transition">
              Sign Up Now
            </a>
          </Link>
        </div>
      </div>
    </>
  )
}

SignInPage.getLayout = (page) => (
  <SignInLayout
    heading="Welcome back"
    subheading="Sign in to your account"
    logoLinkToMarketingSite={true}
  >
    {page}
  </SignInLayout>
)

export default SignInPage
