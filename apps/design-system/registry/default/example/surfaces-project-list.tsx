'use client'

import { toast } from 'sonner'
import { ProjectList } from 'surfaces/project'

import { sampleCapabilities, sampleOrganizations, sampleProjects } from './surfaces-sample-data'

export default function SurfacesProjectList() {
  return (
    <div className="flex h-[480px] w-full min-h-0 flex-col overflow-hidden rounded-md border">
      <ProjectList
        projects={sampleProjects}
        organizations={sampleOrganizations}
        capabilities={sampleCapabilities}
        isLoading={false}
        onOpenProject={(project) => toast(`Open ${project.name}`)}
        onRefresh={() => toast('Refresh projects')}
        onCreate={() => toast('Create a project')}
        onAsk={async (request) => {
          // The host turns the request into a message for its agent.
          toast(`Agent request: ${request.type}`)
        }}
      />
    </div>
  )
}
