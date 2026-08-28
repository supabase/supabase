import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/project/$ref/explorer-test/query/$id')({
  // Query tabs have no stable external id to deep-link to — landing here
  // with a stale/unknown id is corrected by `useSyncTabToUrl`, which
  // rewrites the URL back to whatever tab is actually current.
  component: () => null,
})
