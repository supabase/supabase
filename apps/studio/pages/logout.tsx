import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { toast } from 'sonner'

import { Loading } from 'components/ui/Loading'
import { useSignOut } from 'lib/auth'
import { NextPageWithLayout } from 'types'

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
      <Loading />
    </div>
  )
}

export default LogoutPage
