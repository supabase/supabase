import { branchSchema } from 'surfaces/contract'

import { decodeToolResult } from '../host/tool-data-port'
import { BranchCardScreen, branchScopedProjectId } from '../shell/BranchCardScreen'
import { mountToolCallView } from './mount'

// Rendered from create_branch: the result is the new branch, as the model sees it.
mountToolCallView('branch-card', {
  decode: (result) => branchSchema.parse(decodeToolResult(result)),
  scopedProjectId: branchScopedProjectId,
  preview: import.meta.env.DEV
    ? (name) =>
        import('../preview/project-card').then(({ previewBranchCard }) => previewBranchCard(name))
    : undefined,
  render: (session) => <BranchCardScreen session={session} />,
})
