import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from 'ui'
import Head from 'next/head'

export default function Custom404() {
  const [show404, setShow404] = useState<boolean>(false)

  useEffect(() => {
    setTimeout(() => {
      setShow404(true)
    }, 500)
  }, [])

  return (
    <>
      <Head>
        <title>404 | Supabase</title>
      </Head>
      <div className="relative mx-auto flex h-screen w-full flex-col items-center justify-center">
        <div className="absolute">
          <h1
            className={`text-scale-1200 select-none text-[14rem] opacity-[5%] filter transition duration-200 sm:text-[18rem] lg:text-[28rem] ${
              show404 ? 'blur-sm' : 'blur-none'
            }`}
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
    </>
  )
}
