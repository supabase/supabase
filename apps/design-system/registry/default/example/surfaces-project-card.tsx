'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ProjectCard } from 'surfaces/project'

import { sampleProject } from './surfaces-sample-data'

const starting = { ...sampleProject, name: 'Support inbox', status: 'COMING_UP' }

/** A host follows a new project's status; here it becomes Active after a few seconds. */
function LiveCard() {
  const startNow = () => ({ ...starting, created_at: new Date().toISOString() })
  const [project, setProject] = useState(startNow)
  useEffect(() => {
    if (project.status !== 'COMING_UP') return
    const timer = setTimeout(
      () => setProject((current) => ({ ...current, status: 'ACTIVE_HEALTHY' })),
      4000
    )
    return () => clearTimeout(timer)
  }, [project.status])
  return (
    <ProjectCard
      project={project}
      organizationName="Acme"
      isFollowing
      onRefresh={() => setProject(startNow())}
      onOpenDashboard={() => toast('Open the project in the dashboard')}
    />
  )
}

export default function SurfacesProjectCard() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-4">
      <LiveCard />
      <ProjectCard
        project={{ ...sampleProject, status: 'INACTIVE' }}
        organizationName="Acme"
        onRefresh={() => toast('Refresh status')}
      />
      <ProjectCard
        project={starting}
        organizationName="Acme"
        error="Network error"
        onRefresh={() => toast('Retry status check')}
      />
    </div>
  )
}
