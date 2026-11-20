import { createFileRoute } from '@tanstack/react-router'

import { UsersV2 } from '@/components/interfaces/Auth/Users/UsersV2'

export const Route = createFileRoute('/project/$ref/auth/users')({
  component: UsersV2,
  staticData: {
    authLayoutTitle: 'Users',
  },
})
