import Image from 'next/image'
import Link from 'next/link'
import Head from 'next/head'
import { observer } from 'mobx-react-lite'
import { Button, IconGitHub, Typography } from '@supabase/ui'

import { useStore } from 'hooks'
import { auth } from 'lib/gotrue'

const Landing = () => {
  const { ui } = useStore()
  const { theme } = ui

  async function handleGithubSignIn() {
    try {
      const { error } = await auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}?auth=true`,
        },
      })
      if (error) throw error
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="relative z-10 flex h-screen flex-col">
      <Head>
        <title>Supabase</title>
      </Head>
      <div className="sticky top-0 mx-auto w-full max-w-7xl px-8 pt-6 sm:px-6 lg:px-8">
        <nav className="relative flex items-center justify-between sm:h-10">
          <div className="flex flex-shrink-0 flex-grow items-center lg:flex-grow-0">
            <div className="flex w-full items-center justify-between md:w-auto">
              <a href="https://supabase.com">
                <Image
                  src={theme == 'dark' ? '/img/supabase-dark.svg' : '/img/supabase-light.svg'}
                  alt=""
                  height={24}
                  width={120}
                />
              </a>
            </div>
          </div>
          <div className="hidden items-center space-x-3 md:ml-10 md:flex md:pr-4">
            <a
              href="https://supabase.com/docs"
              className="text-scale-1100 hover:text-scale-1200 text-sm transition-colors"
            >
              Documentation
            </a>
            <Button onClick={handleGithubSignIn} icon={<IconGitHub />}>
              Sign In with GitHub
            </Button>
          </div>
        </nav>
      </div>
      <div className="mx-auto flex h-full max-w-screen-xl items-center justify-center px-8">
        <div className="sm:text-center">
          <h1 className="text-3xl">
            Give Your Database <span className="text-brand-900">Superpowers</span>
          </h1>
          <p className="text-scale-1100 mb-10 text-base sm:mx-auto sm:max-w-2xl md:mt-5">
            Create a backend in less than 2 minutes. Start your project with a Postgres Database,
            Authentication, instant APIs, and realtime subscriptions.
          </p>

          <div className="flex items-center space-x-2 sm:justify-center">
            <Button onClick={handleGithubSignIn} size="medium" icon={<IconGitHub />}>
              Sign In with GitHub
            </Button>
            <Link href="https://supabase.com/docs">
              <Button size="medium" type="default">
                Docs
              </Button>
            </Link>
          </div>

          <div className="sm:text-center">
            <p className="text-scale-900 mt-8 mb-5 text-xs sm:mx-auto sm:max-w-sm">
              By continuing, you agree to Supabase's{' '}
              <Link href="https://supabase.com/docs/company/terms">
                <a className="hover:text-scale-1100 underline">Terms of Service</a>
              </Link>{' '}
              and{' '}
              <Link href="https://supabase.com/docs/company/privacy">
                <a className="hover:text-scale-1100 underline">Privacy Policy</a>
              </Link>
              , and to receive periodic emails with updates.
            </p>
          </div>

          <hr className="mt-16 max-w-[75px] border-zinc-500 sm:mx-auto " />

          <div className="sm:text-center">
            <p className="text-scale-900 mt-16 mb-5 text-base sm:mx-auto sm:max-w-2xl">
              Ready to learn about our pay-as-you-go Enterprise plan?
            </p>
            <Link href="https://supabase.com/contact/enterprise">Let's talk!</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default observer(Landing)
