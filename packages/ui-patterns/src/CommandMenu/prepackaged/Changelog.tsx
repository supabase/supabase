import { useRegisterCommands } from '..'
import { Inbox } from 'lucide-react'

import { BASE_PATH } from './shared/constants'

const useChangelogCommand = ({ enabled = true }: { enabled?: boolean } = {}) => {
  useRegisterCommands(
    'Updates',
    [
      {
        id: 'changelog',
        name: 'View changelog',
        route: BASE_PATH ? 'https://supabase.com/changelog' : '/changelog',
        icon: () => <Inbox />,
      },
    ],
    { enabled }
  )
}

export { useChangelogCommand }
