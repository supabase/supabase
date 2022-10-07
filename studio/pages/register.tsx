import LoginWithGitHub from 'components/interfaces/Login/LoginWithGitHub'
import RegisterForm from 'components/interfaces/Login/RegisterForm'
import { LoginLayout } from 'components/layouts'
import Link from 'next/link'
import { NextPageWithLayout } from 'types'

const RegisterPage: NextPageWithLayout = () => {
  return (
    <>
      <div className="flex flex-col gap-4">
        <LoginWithGitHub />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-scale-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-scale-400 px-2">Or</span>
          </div>
        </div>

        <RegisterForm />
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

RegisterPage.getLayout = (page) => <LoginLayout title="Create a New Account">{page}</LoginLayout>

export default RegisterPage
