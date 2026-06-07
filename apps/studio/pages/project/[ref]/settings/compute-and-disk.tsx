import { ComputeAndDiskForm } from '@/components/interfaces/Settings/Compute/ComputeAndDiskForm'
import DefaultLayout from '@/components/layouts/DefaultLayout'
import SettingsLayout from '@/components/layouts/ProjectSettingsLayout/SettingsLayout'
import {
  ScaffoldContainer,
  ScaffoldDescription,
  ScaffoldHeader,
  ScaffoldTitle,
} from '@/components/layouts/Scaffold'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import type { NextPageWithLayout } from '@/types'

const AuthSettings: NextPageWithLayout = () => {
  // [console fork] Dedicated projects can resize their instance; shared-infra projects
  // have no per-project compute to change. (Replaces the cloud DiskManagementForm.)
  const { data: project } = useSelectedProjectQuery()
  const isDedicated = !!(project as any)?.infra_compute_size && (project as any)?.region !== 'shared'
  return (
    <>
      <ScaffoldContainer>
        <ScaffoldHeader>
          <ScaffoldTitle>Compute and Disk</ScaffoldTitle>
          <ScaffoldDescription>
            {isDedicated
              ? "Resize your dedicated project's compute instance."
              : 'Compute is managed automatically for shared-infrastructure projects.'}
          </ScaffoldDescription>
        </ScaffoldHeader>
      </ScaffoldContainer>
      <ScaffoldContainer className="mt-4">
        {isDedicated ? (
          <ComputeAndDiskForm />
        ) : (
          <div className="rounded-md border border-default bg-surface-100 p-6 text-sm text-foreground-light">
            This is a shared-infrastructure project — its compute is managed automatically and has
            no per-project instance size to change. Create a dedicated project to choose and resize
            compute.
          </div>
        )}
      </ScaffoldContainer>
    </>
  )
}

AuthSettings.getLayout = (page) => (
  <DefaultLayout>
    <SettingsLayout title="Compute and Disk">{page}</SettingsLayout>
  </DefaultLayout>
)
export default AuthSettings
