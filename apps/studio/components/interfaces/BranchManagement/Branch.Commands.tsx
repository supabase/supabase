import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Forward, GitBranch, Plus } from 'lucide-react'
import { PageType, useRegisterCommands, useRegisterPage, useSetPage } from 'ui-patterns/CommandMenu'

import { COMMAND_MENU_SECTIONS } from '../App/CommandMenu/CommandMenu.utils'
import { orderCommandSectionsByPriority } from '../App/CommandMenu/ordering'
import { BRANCHING_GITHUB_DISCUSSION_LINK } from './BranchManagement.constants'
import { useBranchesQuery } from '@/data/branches/branches-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useAppStateSnapshot } from '@/state/app-state'

const SWITCH_BRANCH_PAGE_NAME = 'Switch branch'
const EMPTY_ARRAY = [] as Array<any>

export function useBranchCommands() {
  const setPage = useSetPage()
  const { setShowCreateBranchModal } = useAppStateSnapshot()

  const { data: selectedProject } = useSelectedProjectQuery()
  const ref = selectedProject?.ref || '_'
  const isBranchingEnabled = selectedProject?.is_branch_enabled === true

  const { can: canCreateBranches } = useAsyncCheckPermissions(
    PermissionAction.CREATE,
    'preview_branches',
    { resource: { is_default: false } }
  )

  let { data: branches } = useBranchesQuery(
    { projectRef: selectedProject?.parent_project_ref || selectedProject?.ref },
    { enabled: isBranchingEnabled }
  )

  branches ??= EMPTY_ARRAY

  useRegisterPage(
    SWITCH_BRANCH_PAGE_NAME,
    {
      type: PageType.Commands,
      sections: [
        {
          id: 'switch-branch',
          name: 'Switch branch',
          commands: branches.map((branch) => ({
            id: `branch-${branch.id}`,
            name: branch.name,
            route: `/project/${branch.project_ref}`,
            icon: () => <Forward />,
          })),
        },
      ],
    },
    { enabled: isBranchingEnabled && branches.length > 0, deps: [branches] }
  )

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.ACTIONS,
    [
      {
        id: 'switch-branch',
        name: 'Switch branch',
        value: 'Switch branch, Change branch, Select branch',
        action: () => setPage(SWITCH_BRANCH_PAGE_NAME),
        icon: () => <GitBranch />,
      },
    ],
    {
      enabled: isBranchingEnabled && branches.length > 0,
      orderSection: orderCommandSectionsByPriority,
      sectionMeta: { priority: 3 },
    }
  )

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.ACTIONS,
    [
      {
        id: 'create-branch',
        name: 'Create branch',
        value: 'Create branch, New branch',
        action: () => setShowCreateBranchModal(true),
        icon: () => <Plus />,
      },
    ],
    {
      enabled: canCreateBranches,
      orderSection: orderCommandSectionsByPriority,
      sectionMeta: { priority: 3 },
    }
  )

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.NAVIGATE,
    [
      {
        id: 'nav-branch-management',
        name: 'Branch management',
        route: `/project/${ref}/branches`,
      },
      {
        id: 'nav-branch-merge-requests',
        name: 'Merge requests',
        value: 'Branch',
        route: `/project/${ref}/branches/merge-requests`,
      },
    ],
    { enabled: !!selectedProject }
  )

  useRegisterCommands(COMMAND_MENU_SECTIONS.NAVIGATE, [
    {
      id: 'nav-branch-feedback',
      name: 'Branching feedback',
      route: BRANCHING_GITHUB_DISCUSSION_LINK,
    },
  ])
}
