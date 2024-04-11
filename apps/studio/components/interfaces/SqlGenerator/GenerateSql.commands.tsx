import { useAppStateSnapshot } from 'state/app-state'
import { AiIconAnimation } from 'ui'

import { BadgeExperimental, useRegisterCommands, useSetQuery } from 'ui-patterns/CommandMenu'

const useGenerateSqlCommand = () => {
  const { setShowGenerateSqlModal } = useAppStateSnapshot()
  const setQuery = useSetQuery()

  useRegisterCommands('Experimental', [
    {
      id: 'generate-sql',
      name: 'Generate SQL with Supabase AI',
      action: () => {
        setShowGenerateSqlModal(true)
        setQuery('')
      },
      icon: () => <AiIconAnimation allowHoverEffect />,
      badge: () => <BadgeExperimental />,
    },
  ])
}

export { useGenerateSqlCommand }
