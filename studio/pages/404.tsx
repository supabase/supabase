import { NextPage } from 'next'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@supabase/ui'

import { useStore } from 'hooks'

const Error404: NextPage = ({}) => {
  const { ui } = useStore()
  const { theme } = ui

  const [show404, setShow404] = useState<boolean>(false)

  useEffect(() => {
    setTimeout(() => {
      setShow404(true)
    }, 500)
  }, [])

  return (
    <div className="w-full h-screen relative flex flex-col items-center justify-center mx-auto">
      <div className="absolute top-0 w-full max-w-7xl mx-auto pt-6 px-8 sm:px-6 lg:px-8">
        <nav className="relative flex items-center justify-between sm:h-10">
          <div className="flex items-center flex-grow flex-shrink-0 lg:flex-grow-0">
            <div className="flex items-center justify-between w-full md:w-auto">
              <a href="/">
                <Image
                  src={theme == 'dark' ? '/img/supabase-dark.svg' : '/img/supabase-light.svg'}
                  alt="supabase"
                  height={24}
                  width={120}
                />
              </a>
            </div>
          </div>
        </nav>
      </div>
      <div
        className={`absolute select-none filter transition opacity-[5%] duration-200 ${
          show404 ? 'blur-sm' : 'blur-none'
        }`}
      >
        <h1 style={{ fontSize: '28rem' }}>404</h1>
      </div>
      <div
        className={`transition flex flex-col space-y-6 items-center justify-center ${
          show404 ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="w-[380px] flex flex-col items-center justify-center space-y-3 text-center">
          <h3 className="text-xl">Looking for something? 🔍</h3>
          <p className="text-scale-1100">We couldn't find the page that you're looking for!</p>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/">
            <a>
              <Button size="small">Head back</Button>
            </a>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Error404
