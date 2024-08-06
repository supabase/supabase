import { useParams } from 'next/navigation'

import { useAppStateSnapshot } from 'state/app-state'
import { AiIconAnimation } from 'ui'
import { BadgeExperimental, useRegisterCommands, useSetQuery } from 'ui-patterns/CommandMenu'
import { orderCommandSectionsByPriority } from '../App/CommandMenu/ordering'

export function useGenerateSqlCommand() {
  const { setShowGenerateSqlModal } = useAppStateSnapshot()
  const setQuery = useSetQuery()

  /**
   * The modal only exists in ProjectLayout because it needs access to
   * project context if sending the schema. TODO: Find a way to generalize this
   * and move it back to main layout.
   */
  const ref = useParams()?.ref

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
      enabled: !!ref,
      deps: [setShowGenerateSqlModal, setQuery],
      orderSection: orderCommandSectionsByPriority,
      sectionMeta: { priority: 2 },
    }
  )
}
