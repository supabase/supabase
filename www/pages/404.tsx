import { NextPage } from 'next'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button, Typography } from '@supabase/ui'

import DefaultLayout from '../components/Layouts/Default'

type Props = {
  darkMode: boolean
}

const Error404 = (props: Props) => {
  const [show404, setShow404] = useState<boolean>(false)
  const { darkMode } = props

  useEffect(() => {
    setTimeout(() => {
      setShow404(true)
    }, 500)
  }, [])

  return (
    <DefaultLayout hideHeader hideFooter>
      <div className="w-full h-screen relative flex flex-col items-center justify-center mx-auto">
        <div className="absolute top-0 w-full max-w-7xl mx-auto pt-6 px-8 sm:px-6 lg:px-8">
          <nav className="relative flex items-center justify-between sm:h-10">
            <div className="flex items-center flex-grow flex-shrink-0 lg:flex-grow-0">
              <div className="flex items-center justify-between w-full md:w-auto">
                <a href="/">
                  <Image
                    src={
                      darkMode
                        ? '/images/supabase-logo-wordmark--light.svg'
                        : '/images/supabase-logo-wordmark--dark.svg'
                    }
                    alt=""
                    height={24}
                    width={120}
                  />
                </a>
              </div>
            </div>
          </nav>
        </div>
        <div className="absolute">
          <Typography.Title
            className={`select-none filter transition opacity-[5%] duration-200 ${
              show404 ? 'blur-sm' : 'blur-none'
            }`}
            style={{ fontSize: '28rem' }}
          >
            404
          </Typography.Title>
        </div>
        <div
          className={`transition flex flex-col space-y-6 items-center justify-center ${
            show404 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="w-[320px] flex flex-col items-center justify-center space-y-3">
            <Typography.Title level={3}>Looking for something? 🔍</Typography.Title>
            <Typography.Text className="text-center">
              We couldn't find the page that you're looking for!
            </Typography.Text>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/">
              <a>
                <Button>Head back</Button>
              </a>
            </Link>
          </div>
        </div>
      </div>
    </DefaultLayout>
  )
}

export default Error404
