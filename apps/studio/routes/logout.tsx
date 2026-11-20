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
      try {
        await signOut()
        toast('Successfully logged out')
      } catch (error) {
        console.error('Failed to sign out', error)
        toast.error('Something went wrong while signing out. Please sign in again.')
      } finally {
        await navigate({ to: '/sign-in' })
      }
    }
    void logout()
  }, [])

  return (
    <div className="w-full h-screen flex items-center justify-center">
      <LogoLoader />
    </div>
  )
}
