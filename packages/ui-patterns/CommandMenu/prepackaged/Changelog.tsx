import { Inbox } from 'lucide-react'

import { useRegisterCommands } from '..'
import { BASE_PATH } from './shared/constants'

const useChangelogCommand = () => {
  useRegisterCommands('Updates', [
    {
      id: 'changelog',
      name: 'Changelog',
      route: BASE_PATH ? 'https://supabase.com/changelog' : '/changelog',
      icon: () => <Inbox />,
    },
  ])
}

export { useChangelogCommand }
