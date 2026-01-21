import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { toast } from 'sonner'

import { useSignOut } from 'lib/auth'
import { IS_PLATFORM, STUDIO_AUTH_ENABLED } from 'lib/constants'
import type { NextPageWithLayout } from 'types'
import { LogoLoader } from 'ui'

const LogoutPage: NextPageWithLayout = () => {
  const router = useRouter()
  const signOut = useSignOut()

  useEffect(() => {
    const logout = async () => {
      await signOut()
      toast('Successfully logged out')
      // Redirect to sign-in if using real auth, otherwise to project page
      const redirectPath = IS_PLATFORM || STUDIO_AUTH_ENABLED ? '/sign-in' : '/project/default'
      await router.push(redirectPath)
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
