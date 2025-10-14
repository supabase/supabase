import { useQuickActionOptions } from './ProjectLayout/LayoutHeader/quick-actions.utils'
import { useSelectedOrganizationQuery } from '../../hooks/misc/useSelectedOrganization'
import { useRegisterCommands } from 'ui-patterns'
import { useMemo } from 'react'

export const useQuickActionsCommands = () => {
  const { data: selectedOrg } = useSelectedOrganizationQuery()
  const { allActions } = useQuickActionOptions({
    organization: selectedOrg?.slug,
  })

  // Create command menu items from ALL quick actions (not just selected ones)
  const quickActionCommands = useMemo(
    () =>
      allActions.map((action) => ({
        id: action.id,
        name: `Create ${action.label}`,
        value: `create ${action.label.toLowerCase()} ${action.kbd?.join(' ') || ''}`,
        icon: () => <action.icon size={16} />,
        action: () => {
          action.onClick?.({
            organization: selectedOrg?.slug,
            triggerMethod: 'command-menu',
          })
        },
      })),
    [allActions, selectedOrg?.slug]
  )

  // Register the commands with the command menu
  useRegisterCommands('Quick Actions', quickActionCommands, {
    enabled: allActions && allActions.length > 0,
    deps: [allActions, selectedOrg?.slug],
  })

  return {
    quickActionCommands,
    allActions,
  }
}
