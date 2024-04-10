import { Book } from 'lucide-react'
import { useAppStateSnapshot } from 'state/app-state'

import { BadgeExperimental, useRegisterCommands } from 'ui-patterns/CommandMenu'

const useGenerateSqlCommand = () => {
  const { setShowGenerateSqlModal } = useAppStateSnapshot()

  useRegisterCommands('Experimental', [
    {
      id: 'generate-sql',
      name: 'Generate SQL with Supabase AI',
      action: () => setShowGenerateSqlModal(true),
      icon: () => <Book />,
      badge: () => <BadgeExperimental />,
    },
  ])
}

export { useGenerateSqlCommand }
