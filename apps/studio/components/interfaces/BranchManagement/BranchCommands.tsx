import { useBranchesQuery } from 'data/branches/branches-query'
import { useSelectedProject } from 'hooks'
import { Forward, GitBranch } from 'lucide-react'
import {
  PageType,
  orderSectionFirst,
  useRegisterCommands,
  useRegisterPage,
  useSetPage,
} from 'ui-patterns/CommandMenu'

const SWITCH_BRANCH_PAGE_NAME = 'Switch branch'

const useBranchCommands = () => {
  const setPage = useSetPage()

  const selectedProject = useSelectedProject()
  const isBranchingEnabled = selectedProject?.is_branch_enabled === true

  let { data: branches } = useBranchesQuery(
    {
      projectRef: selectedProject?.ref,
    },
    { enabled: isBranchingEnabled }
  )
  branches ??= []

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
    { enabled: isBranchingEnabled }
  )

  useRegisterCommands(
    'Branches',
    [
      {
        id: 'switch-branch',
        name: 'Switch branch',
        value: 'Switch branch, Change branch, Select branch',
        action: () => setPage(SWITCH_BRANCH_PAGE_NAME),
        icon: () => <GitBranch />,
      },
    ],
    { enabled: isBranchingEnabled, orderSection: orderSectionFirst }
  )
}

export { useBranchCommands }
