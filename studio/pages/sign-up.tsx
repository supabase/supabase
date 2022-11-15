import SignInWithGitHub from 'components/interfaces/SignIn/SignInWithGitHub'
import SignUpForm from 'components/interfaces/SignIn/SignUpForm'
import { SignInLayout } from 'components/layouts'
import Link from 'next/link'
import { NextPageWithLayout } from 'types'

const SignUpPage: NextPageWithLayout = () => {
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

        <SignUpForm />
      </div>

      <div className="my-8 self-center text-sm">
        <span className="text-scale-1000">Have an account?</span>{' '}
        <Link href="/sign-in">
          <a className="underline text-scale-1200 hover:text-scale-1100 transition">Sign In Now</a>
        </Link>
      </div>
    </>
  )
}

SignUpPage.getLayout = (page) => (
  <SignInLayout heading="Get started" subheading="Create a new account">
    {page}
  </SignInLayout>
)

export default SignUpPage
