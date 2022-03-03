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
      const { error } = await auth.signIn(
        {
          provider: 'github',
        },
        {
          redirectTo: process.env.NEXT_PUBLIC_SITE_URL,
        }
      )
      if (error) throw error
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="z-10 relative h-screen flex flex-col">
      <Head>
        <title>Supabase</title>
      </Head>
      <div className="sticky top-0 w-full max-w-7xl mx-auto pt-6 px-8 sm:px-6 lg:px-8">
        <nav className="relative flex items-center justify-between sm:h-10">
          <div className="flex items-center flex-grow flex-shrink-0 lg:flex-grow-0">
            <div className="flex items-center justify-between w-full md:w-auto">
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
          <div className="hidden md:ml-10 md:pr-4 md:flex items-center gap-3">
            <a
              href="https://supabase.com/docs"
              className="text-sm text-scale-1100 hover:text-scale-1200 transition-colors"
            >
              Documentation
            </a>
            <Button onClick={handleGithubSignIn} icon={<IconGitHub />}>
              Sign In with GitHub
            </Button>
          </div>
        </nav>
      </div>
      <div className="flex items-center justify-center mx-auto h-full max-w-screen-xl px-8">
        <div className="sm:text-center">
          <h1 className="text-3xl">
            Give Your Database <span className="text-brand-900">Superpowers</span>
          </h1>
          <p className="text-scale-1100 text-base sm:max-w-2xl sm:mx-auto md:mt-5 mb-10">
            Create a backend in less than 2 minutes. Start your project with a Postgres Database,
            Authentication, instant APIs, and realtime subscriptions.
          </p>

          <div className="sm:justify-center flex items-center gap-2">
            <Button onClick={handleGithubSignIn} size="medium" icon={<IconGitHub />}>
              Sign In with GitHub
            </Button>
            <Link href="https://supabase.com/docs">
              <Button size="medium" type="default">
                Docs
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default observer(Landing)
