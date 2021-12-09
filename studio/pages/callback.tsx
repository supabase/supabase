import Head from 'next/head'
import { NextPage } from 'next'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Connecting from 'components/ui/Loading'
import { auth } from 'lib/gotrue'

const AuthCallback: NextPage = () => {
  const router = useRouter()

  useEffect(() => {
    auth.onAuthStateChange((event) => {
      if (event == 'SIGNED_IN') {
        router.push('/')
      }
    })

    // 5 seconds timeout
    const timer = setTimeout(() => {
      router.push('/')
    }, 5000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <Head>
        <title>Supabase</title>
        <meta name="description" content="Supabase Studio" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex h-full">
        <main
          style={{ maxHeight: '100vh' }}
          className="w-full flex flex-col flex-1 overflow-y-auto"
        >
          <Connecting />
        </main>
      </div>
    </>
  )
}
export default AuthCallback
