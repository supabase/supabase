import { createFileRoute } from '@tanstack/react-router'

import ComputeAndDiskPage from '@/pages/project/[ref]/settings/compute-and-disk'

export const Route = createFileRoute('/project/$ref/settings/compute-and-disk')({
  component: SettingsComputeAndDiskRoute,
  staticData: { settingsLayoutTitle: 'Compute and Disk' },
})

function SettingsComputeAndDiskRoute() {
  return <ComputeAndDiskPage dehydratedState={undefined} />
}
