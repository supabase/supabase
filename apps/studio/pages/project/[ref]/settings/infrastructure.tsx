import { useEffect, useState } from 'react'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import { DiskManagementForm } from '@/components/interfaces/DiskManagement/DiskManagementForm'
import { ProjectInfrastructureDiagram } from '@/components/interfaces/Settings/Infrastructure/ProjectInfrastructureDiagram'
import DefaultLayout from '@/components/layouts/DefaultLayout'
import SettingsLayout from '@/components/layouts/ProjectSettingsLayout/SettingsLayout'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import type { NextPageWithLayout } from '@/types'

const InfrastructureSettings: NextPageWithLayout = () => {
  const { data: project } = useSelectedProjectQuery()
  const [isHighAvailability, setIsHighAvailability] = useState(false)

  useEffect(() => {
    setIsHighAvailability(project?.high_availability ?? false)
  }, [project?.high_availability])

  return (
    <>
      <PageHeader size="default" className="pb-12">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Infrastructure</PageHeaderTitle>
            <PageHeaderDescription>
              View and configure compute, disk, and infrastructure for your project.
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <ProjectInfrastructureDiagram bottomOverlap isHighAvailability={isHighAvailability} />
      <DiskManagementForm
        chartsClassName="-mt-16 relative z-10"
        isHighAvailability={isHighAvailability}
        onHighAvailabilityChange={setIsHighAvailability}
      />
    </>
  )
}

InfrastructureSettings.getLayout = (page) => (
  <DefaultLayout>
    <SettingsLayout title="Infrastructure">{page}</SettingsLayout>
  </DefaultLayout>
)
export default InfrastructureSettings
