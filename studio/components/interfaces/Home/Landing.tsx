import Image from 'next/image'
import Link from 'next/link'
import Head from 'next/head'
import { observer } from 'mobx-react-lite'
import { Button, Typography } from '@supabase/ui'

import { API_URL } from 'lib/constants'
import { useStore } from 'hooks'

const Landing = () => {
  const { ui } = useStore()
  const { theme } = ui

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
          <div className="hidden md:block md:ml-10 md:pr-4">
            <Typography.Text className="ml-8 font-medium hover:text-gray-300 focus:outline-none focus:text-gray-300 transition duration-150 ease-in-out">
              <Link href="https://supabase.com/docs">Documentation</Link>
            </Typography.Text>
            <Typography.Text
              type="success"
              className="ml-8 font-medium hover:text-gray-300 focus:outline-none focus:text-gray-300 transition duration-150 ease-in-out"
            >
              <Link href={`${API_URL}/login`}>Sign In</Link>
            </Typography.Text>
          </div>
        </nav>
      </div>
      <div className="flex items-center justify-center mx-auto h-full max-w-screen-xl px-8">
        <div className="sm:text-center">
          <Typography.Title level={2}>
            Give your database <span className="text-green-500">superpowers</span>
          </Typography.Title>
          <Typography.Text type="secondary">
            <p className="mt-3 text-lg sm:mt-5 sm:max-w-2xl sm:mx-auto md:mt-5 lg:mx-0">
              Create a backend in less than 2 minutes. Start your project with a Postgres Database,
              Authentication, instant APIs, and realtime subscriptions.
            </p>
          </Typography.Text>
          <div className="mt-5 sm:mt-8 sm:flex sm:justify-center space-x-3">
            <Link href={`${API_URL}/login`}>
              <Button size="large">Sign In</Button>
            </Link>
            <Link href="https://supabase.com/docs">
              <Button size="large" type="default">
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
