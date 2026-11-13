import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { LogoLoader } from 'ui'

import { useSignOut } from '@/lib/auth'

export const Route = createFileRoute('/logout')({
  component: LogoutPage,
})

function LogoutPage() {
  const navigate = useNavigate()
  const signOut = useSignOut()

  useEffect(() => {
    const logout = async () => {
      await signOut()
      toast('Successfully logged out')
      await navigate({ to: '/sign-in' })
    }
    logout()
  }, [])

  return (
    <div className="w-full h-screen flex items-center justify-center">
      <LogoLoader />
    </div>
  )
}
