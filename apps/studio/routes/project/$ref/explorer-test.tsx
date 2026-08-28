import { createFileRoute, Outlet } from '@tanstack/react-router'

import { Explorer } from '@/domain/explorer/Explorer'
import { useSyncTabToUrl } from '@/domain/explorer/useSyncTabToUrl'
import { withProjectRef } from '@/domain/project/withProjectRef'

export const Route = createFileRoute('/project/$ref/explorer-test')({
  component: ExplorerTestShell,
})

function ExplorerTestShell() {
  return (
    <Explorer>
      <SyncTabToUrl />
      <Outlet />
    </Explorer>
  )
}

/**
 * A sibling of `<Outlet />`, not a wrapper around `Explorer` — `Explorer`
 * itself is what populates `projectRefAtom` (via `useSyncProjectRef`), so
 * gating `Explorer`'s render on that same atom here would deadlock it.
 */
const SyncTabToUrlInner = ({ projectRef }: { projectRef: string }) => {
  useSyncTabToUrl(projectRef)
  return null
}
const SyncTabToUrl = withProjectRef(SyncTabToUrlInner, null)
