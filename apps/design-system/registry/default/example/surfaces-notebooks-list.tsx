'use client'

import { toast } from 'sonner'
import { NotebooksList } from 'surfaces/project'

import { sampleNotebooks, sampleProject } from './surfaces-sample-data'

export default function SurfacesNotebooksList() {
  return (
    <div className="w-full max-w-2xl">
      <NotebooksList
        project={sampleProject}
        notebooks={{ status: 'success', data: sampleNotebooks }}
        onRefresh={() => toast('Refresh notebooks')}
        onAsk={async (request) => {
          // The host turns the request into a message for its agent.
          toast(`Agent request: ${request.type}`)
        }}
      />
    </div>
  )
}
