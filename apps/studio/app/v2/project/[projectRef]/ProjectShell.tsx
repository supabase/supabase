'use client'

import { RouteParamsOverrideProvider } from 'common'
import { useParams } from 'next/navigation'
import { useMemo } from 'react'

import { V2ParamsProvider } from '@/app/v2/V2ParamsContext'
import { Shell } from '@/components/v2/Shell'
import { ProjectContextProvider } from '@/components/layouts/ProjectLayout/ProjectContext'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'

export function ProjectShell({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const projectRef = params?.projectRef as string | undefined

  const { data: project } = useProjectDetailQuery(
    { ref: projectRef },
    { enabled: Boolean(projectRef) }
  )
  const { data: organizations } = useOrganizationsQuery()

  const orgSlug = useMemo(() => {
    if (!project?.organization_id || !organizations) return undefined
    const org = organizations.find((o) => o.id === project.organization_id)
    return org?.slug
  }, [project?.organization_id, organizations])

  return (
    <RouteParamsOverrideProvider value={{ ref: projectRef }}>
      <V2ParamsProvider projectRef={projectRef} orgSlug={orgSlug}>
        <ProjectContextProvider projectRef={projectRef}>
          <Shell>{children}</Shell>
        </ProjectContextProvider>
      </V2ParamsProvider>
    </RouteParamsOverrideProvider>
  )
}
