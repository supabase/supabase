'use client'

import { toast } from 'sonner'
import { IssuesList } from 'surfaces/project'

import { sampleOverview, sampleProject } from './surfaces-sample-data'

export default function SurfacesIssuesList() {
  return (
    <div className="w-full max-w-2xl">
      <IssuesList
        project={sampleProject}
        issues={{ status: 'success', data: sampleOverview }}
        onRefresh={() => toast('Refresh issues')}
        onAsk={async (request) => {
          // The host turns the request into a message for its agent.
          toast(`Agent request: ${request.type}`)
        }}
      />
    </div>
  )
}
