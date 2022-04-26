import Image from 'next/image'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@supabase/ui'

import DefaultLayout from '../components/Layouts/Default'

import { useTheme } from '~/components/Providers'

const Error404 = () => {
  const [show404, setShow404] = useState<boolean>(false)
  const { isDarkMode } = useTheme()

  useEffect(() => {
    setTimeout(() => {
      setShow404(true)
    }, 500)
  }, [])

  return (
    <DefaultLayout hideHeader hideFooter>
      <div className="relative mx-auto flex h-screen w-full flex-col items-center justify-center">
        <div className="absolute top-0 mx-auto w-full max-w-7xl px-8 pt-6 sm:px-6 lg:px-8">
          <nav className="relative flex items-center justify-between sm:h-10">
            <div className="flex flex-shrink-0 flex-grow items-center lg:flex-grow-0">
              <div className="flex w-full items-center justify-between md:w-auto">
                <a href="/">
                  <Image
                    src={
                      isDarkMode
                        ? '/images/supabase-logo-wordmark--dark.svg'
                        : '/images/supabase-logo-wordmark--light.svg'
                    }
                    alt="supabase logo"
                    height={24}
                    width={120}
                  />
                </a>
              </div>
            </div>
          </nav>
        </div>
        <div className="absolute">
          <h1
            className={`select-none opacity-[5%] filter transition duration-200 ${
              show404 ? 'blur-sm' : 'blur-none'
            }`}
            style={{ fontSize: '28rem' }}
          >
            404
          </h1>
        </div>
        <div
          className={`flex flex-col items-center justify-center space-y-6 transition ${
            show404 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="text-scale-1200 flex w-[320px] flex-col items-center justify-center space-y-3">
            <h1 className="m-2 text-2xl">Looking for something? 🔍</h1>
            <p className="text-center text-sm">
              We couldn't find the page that you're looking for!
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button as="a" size="small" className="text-white">
                Head back
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </DefaultLayout>
  )
}

export default Error404
