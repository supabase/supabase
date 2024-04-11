import { useAppStateSnapshot } from 'state/app-state'
import { AiIconAnimation } from 'ui'

import { BadgeExperimental, useRegisterCommands, useSetQuery } from 'ui-patterns/CommandMenu'

const useGenerateSqlCommand = () => {
  const { setShowGenerateSqlModal } = useAppStateSnapshot()
  const setQuery = useSetQuery()

  useRegisterCommands(
    'Experimental',
    [
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
    ],
    {
      orderSection: (sections, idx) => {
        return [sections[idx], ...sections.slice(0, idx), ...sections.slice(idx + 1)]
      },
    }
  )
}

export { useGenerateSqlCommand }
