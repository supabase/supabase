'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AnnouncerProvider } from 'surfaces/common'
import {
  BRANCH_CREATION_STEPS,
  branchCreationProgress,
  ConnectionDetails,
  creationStatus,
  PROJECT_CREATION_STEPS,
  ProjectCard,
  projectCreationProgress,
  type ConnectionState,
} from 'surfaces/project'

import { sampleProject } from './surfaces-sample-data'

const ref = sampleProject.ref ?? sampleProject.id
const projectUrl = `https://supabase.com/dashboard/project/${ref}`
const details = [
  { label: 'Project ref', value: ref },
  { label: 'Region', value: sampleProject.region },
]

/** A new project's statuses, as a host reads them a few seconds apart. */
const STATUSES = ['COMING_UP', 'COMING_UP', 'ACTIVE_UNHEALTHY', 'ACTIVE_HEALTHY']

/**
 * A host follows what its agent is creating: first only the arguments are
 * known, then the project, then each step until it is ready and its
 * connection details can be opened.
 */
function LiveCard() {
  // -1 while the request is still out; then an index into STATUSES.
  const [read, setRead] = useState(-1)
  const [connection, setConnection] = useState<ConnectionState>({ status: 'idle' })
  const status = STATUSES[read]
  const isLast = read === STATUSES.length - 1

  useEffect(() => {
    if (isLast) return
    const timer = setTimeout(() => setRead((current) => current + 1), 2000)
    return () => clearTimeout(timer)
  }, [read, isLast])

  const { announcement, alert, canRetry, isDone, ...card } = creationStatus({
    noun: 'project',
    call: status ? { status: 'ready', data: sampleProject } : { status: 'loading' },
    status,
    progress: status ? projectCreationProgress(status) : undefined,
    steps: PROJECT_CREATION_STEPS,
    check: { status: isLast ? 'settled' : 'checking' },
    canCheck: true,
    checkWith: 'get_project',
  })

  return (
    <ProjectCard
      {...card}
      breadcrumbs={['Acme']}
      name="Support inbox"
      details={status ? details : [{ label: 'Project ref' }, details[1]]}
      onOpenDashboard={status ? () => toast('Open the project in the dashboard') : undefined}
    >
      {isDone && (
        <ConnectionDetails
          connection={connection}
          onOpen={() =>
            setConnection({
              status: 'details',
              url: `https://${ref}.supabase.co`,
              key: 'sb_publishable_sample',
            })
          }
          projectUrl={projectUrl}
          connectUrl={`${projectUrl}?showConnect=true`}
          onOpenLink={() => toast('Open the link')}
        />
      )}
    </ProjectCard>
  )
}

const branch = creationStatus({
  noun: 'branch',
  call: { status: 'ready', data: {} },
  status: 'RUNNING_MIGRATIONS',
  progress: branchCreationProgress('RUNNING_MIGRATIONS'),
  steps: BRANCH_CREATION_STEPS,
  check: { status: 'checking' },
  canCheck: true,
  checkWith: 'list_branches',
})

export default function SurfacesProjectCard() {
  return (
    <AnnouncerProvider>
      <div className="flex w-full max-w-xl flex-col gap-4">
        <LiveCard />
        <ProjectCard
          badge={branch.badge}
          breadcrumbs={['Acme', sampleProject.name]}
          name="develop"
          details={[{ label: 'Branch project ref', value: 'qhzmpxvbtrwkcnsldjfa' }]}
          onOpenDashboard={() => toast('Open the branch in the dashboard')}
        />
        <ProjectCard
          breadcrumbs={['Acme']}
          name={sampleProject.name}
          badge={{
            label: 'Check failed',
            tone: 'danger',
            title: 'Failed to check status: Network error',
          }}
          note={{ tone: 'danger', text: "Can't check status: Network error." }}
          details={details}
          onRetry={() => toast('Check the status again')}
          onOpenDashboard={() => toast('Open the project in the dashboard')}
        />
        <ProjectCard isLoading details={[{ label: 'Project ref' }, { label: 'Region' }]} />
      </div>
    </AnnouncerProvider>
  )
}
