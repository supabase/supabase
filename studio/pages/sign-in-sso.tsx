import SignInSSOForm from 'components/interfaces/SignIn/SignInSSOForm'
import { SignInLayout } from 'components/layouts'
import Link from 'next/link'
import { NextPageWithLayout } from 'types'

const SignInSSOPage: NextPageWithLayout = () => {
  return (
    <>
      <div className="flex flex-col gap-5">
        <SignInSSOForm />
      </div>

      <div className="my-8 self-center text-sm">
        <div>
          <span className="text-scale-1000">Interested in SSO?</span>{' '}
          <a
            href="https://supabase.com/contact/enterprise"
            rel="noopener noreferrer"
            className="underline text-scale-1200 hover:text-scale-1100 transition"
          >
            Let Us Know
          </a>
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
