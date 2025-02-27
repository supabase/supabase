import { Forward, GitBranch } from 'lucide-react'

import { useBranchesQuery } from 'data/branches/branches-query'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { PageType, useRegisterCommands, useRegisterPage, useSetPage } from 'ui-patterns/CommandMenu'
import { COMMAND_MENU_SECTIONS } from '../App/CommandMenu/CommandMenu.utils'
import { orderCommandSectionsByPriority } from '../App/CommandMenu/ordering'

const SWITCH_BRANCH_PAGE_NAME = 'Switch branch'
const EMPTY_ARRAY = [] as Array<any>

export function useBranchCommands() {
  const setPage = useSetPage()

  const selectedProject = useSelectedProject()
  const isBranchingEnabled = selectedProject?.is_branch_enabled === true

  let { data: branches } = useBranchesQuery(
    {
      projectRef: selectedProject?.parentRef,
    },
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
}
