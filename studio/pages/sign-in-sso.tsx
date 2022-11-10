import SignInSSOForm from 'components/interfaces/SignIn/SignInSSOForm'
import { SignInLayout } from 'components/layouts'
import Connecting from 'components/ui/Loading'
import { auth } from 'lib/gotrue'
import Link from 'next/link'
import { NextRouter, useRouter } from 'next/router'
import { useEffect } from 'react'
import { NextPageWithLayout } from 'types'

const SignInSSOPage: NextPageWithLayout = () => {
  return (
    <>
      <div className="flex flex-col gap-5">
        <SignInSSOForm />
      </div>

      <div className="my-8 self-center text-sm">
        <div>
          <span className="text-scale-1000">Don't have an enterprise account?</span>{' '}
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

SignInSSOPage.getLayout = (page) => (
  <SignInLayout
    heading="Welcome back"
    subheading="Sign in to your enterprise account"
    logoLinkToMarketingSite={true}
  >
    {page}
  </SignInLayout>
)

export default SignInSSOPage
