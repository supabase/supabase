import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { toast } from 'sonner'

import { useSignOut } from 'lib/auth'
import type { NextPageWithLayout } from 'types'
import { LogoLoader } from 'ui'

const LogoutPage: NextPageWithLayout = () => {
  const router = useRouter()
  const signOut = useSignOut()

  useEffect(() => {
    const logout = async () => {
      await signOut()
      toast('Successfully logged out')
      await router.push('/sign-in')
    }
    logout()
  }, [])

  return (
    <div className="w-full h-screen flex items-center justify-center">
      <LogoLoader />
    </div>
  )
}

export default LogoutPage
