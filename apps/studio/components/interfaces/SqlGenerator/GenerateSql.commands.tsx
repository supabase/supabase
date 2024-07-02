import { useParams } from 'next/navigation'
import { useAppStateSnapshot } from 'state/app-state'
import { AiIconAnimation } from 'ui'

import {
  BadgeExperimental,
  orderSectionFirst,
  useRegisterCommands,
  useSetQuery,
} from 'ui-patterns/CommandMenu'

const useGenerateSqlCommand = () => {
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
      orderSection: orderSectionFirst,
    }
  )
}

export { useGenerateSqlCommand }
