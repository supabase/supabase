import { createFileRoute } from '@tanstack/react-router'

import UsersPage from '@/pages/project/[ref]/auth/users'

export const Route = createFileRoute('/project/$ref/auth/users')({
  component: AuthUsersRoute,
  staticData: {
    authLayoutTitle: 'Users',
  },
})

function AuthUsersRoute() {
  return <UsersPage dehydratedState={undefined} />
}
