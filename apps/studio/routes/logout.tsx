import { createFileRoute } from '@tanstack/react-router'

import LogoutPage from '@/pages/logout'

export const Route = createFileRoute('/logout')({
  component: Logout,
})

function Logout() {
  return <LogoutPage dehydratedState={undefined} />
}
