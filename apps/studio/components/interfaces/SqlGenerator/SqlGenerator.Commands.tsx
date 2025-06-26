import { useIsLoggedIn } from 'common'
import { useAppStateSnapshot } from 'state/app-state'
import { AiIconAnimation } from 'ui'
import { BadgeExperimental, useRegisterCommands, useSetQuery } from 'ui-patterns/CommandMenu'
import { orderCommandSectionsByPriority } from '../App/CommandMenu/ordering'
import { COMMAND_MENU_SECTIONS } from '../App/CommandMenu/CommandMenu.utils'

export function useGenerateSqlCommand() {
  const isLoggedIn = useIsLoggedIn()

  const { setShowGenerateSqlModal } = useAppStateSnapshot()
  const setQuery = useSetQuery()

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.QUERY,
    [
      {
        id: 'generate-sql-ai',
        name: 'Run SQL with Supabase AI',
        action: () => {
          setShowGenerateSqlModal(true)
          setQuery('')
        },
        icon: () => <AiIconAnimation allowHoverEffect />,
        badge: () => <BadgeExperimental />,
      },
    ],
    {
      enabled: isLoggedIn,
      orderSection: orderCommandSectionsByPriority,
      sectionMeta: { priority: 2 },
    }
  )
}
