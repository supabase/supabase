'use client'

import { toast } from 'sonner'
import { ProjectHome } from 'surfaces/project'

import {
  sampleCapabilities,
  sampleNotebooks,
  sampleOverview,
  sampleProject,
} from './surfaces-sample-data'

export default function SurfacesProjectHome() {
  return (
    <div className="flex h-[640px] w-full min-h-0 flex-col overflow-hidden rounded-md border">
      <ProjectHome
        project={sampleProject}
        capabilities={sampleCapabilities}
        organizationName="Acme"
        overview={{ status: 'success', data: sampleOverview }}
        onRefresh={() => toast('Refresh overview')}
        notebooks={{ status: 'success', data: sampleNotebooks }}
        onAsk={async (request) => {
          // The host turns the request into a message for its agent.
          toast(`Agent request: ${request.type}`)
        }}
      />
    </div>
  )
}
