import { useParams } from 'common'
import { Pause, Play, Zap } from 'lucide-react'
import Link from 'next/link'
import { parseAsStringEnum, useQueryState } from 'nuqs'
import { useEffect } from 'react'
import { toast } from 'sonner'
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  NavMenu,
  NavMenuItem,
} from 'ui'
import { PageBreadcrumbs, PageBreadcrumbsActions } from 'ui-patterns/PageBreadcrumbs'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageNav } from 'ui-patterns/PageNav'

import { WorkerLogsTab } from './WorkerLogsTab'
import { WorkerOverviewTab } from './WorkerOverviewTab'
import { WorkerSettingsTab } from './WorkerSettingsTab'
import {
  ensureProjectSeeded,
  resumeWorker,
  simulateTraffic,
  suspendWorker,
  useProjectWorkers,
} from '@/state/workers-mock-state'

type WorkerTab = 'overview' | 'logs' | 'terminal' | 'settings'
const WORKER_TABS: WorkerTab[] = ['overview', 'logs', 'terminal', 'settings']

const TAB_LABEL: Record<WorkerTab, string> = {
  overview: 'Overview',
  logs: 'Logs',
  terminal: 'Terminal',
  settings: 'Settings',
}

export const WorkerDetail = () => {
  const { ref, name } = useParams()
  const projectRef = ref as string
  const workerName = name as string

  const [tab, setTab] = useQueryState(
    'tab',
    parseAsStringEnum<WorkerTab>(WORKER_TABS)
      .withDefault('overview')
      .withOptions({ history: 'push' })
  )

  useEffect(() => {
    ensureProjectSeeded(ref)
  }, [ref])

  const workers = useProjectWorkers(ref)
  const worker = workers.find((w) => w.name === workerName)

  if (!worker) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
        <p className="text-sm text-foreground-light">
          Worker "{workerName}" does not exist in this project
        </p>
        <Button asChild variant="default">
          <Link href={`/project/${projectRef}/workers`}>Back to workers</Link>
        </Button>
      </div>
    )
  }

  const isActive = worker.state === 'active'
  const isSuspended = worker.state === 'suspended'

  const handleSimulateTraffic = () => {
    const requests = simulateTraffic(projectRef, worker.id)
    if (requests > 0) toast.success(`Simulated ${requests.toLocaleString()} requests`)
    else toast.info('Traffic can only be simulated on an active worker')
  }

  return (
    <div className="w-full">
      <PageBreadcrumbs
        actions={
          <PageBreadcrumbsActions>
            <Button
              variant="default"
              size="tiny"
              icon={<Zap size={14} />}
              disabled={!isActive}
              onClick={handleSimulateTraffic}
            >
              Simulate traffic
            </Button>
            {isActive && (
              <Button
                variant="default"
                size="tiny"
                icon={<Pause size={14} />}
                onClick={() => suspendWorker(projectRef, worker.id)}
              >
                Suspend
              </Button>
            )}
            {isSuspended && (
              <Button
                variant="default"
                size="tiny"
                icon={<Play size={14} />}
                onClick={() => resumeWorker(projectRef, worker.id)}
              >
                Resume
              </Button>
            )}
          </PageBreadcrumbsActions>
        }
      >
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/project/${projectRef}/workers`}>Workers</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{worker.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </PageBreadcrumbs>

      <PageNav>
        <NavMenu>
          {WORKER_TABS.map((item) => (
            <NavMenuItem key={item} active={tab === item}>
              <button
                type="button"
                aria-pressed={tab === item}
                className="flex h-full items-center gap-1.5 bg-transparent text-inherit"
                onClick={() => setTab(item)}
              >
                {TAB_LABEL[item]}
                {item === 'terminal' && (
                  <span className="rounded-full border border-strong px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-foreground-lighter">
                    Soon
                  </span>
                )}
              </button>
            </NavMenuItem>
          ))}
        </NavMenu>
      </PageNav>

      {tab === 'overview' && <WorkerOverviewTab projectRef={projectRef} worker={worker} />}
      {tab === 'logs' && (
        <PageContainer size="full" className="px-0 xl:px-0">
          <WorkerLogsTab projectRef={projectRef} workerName={worker.name} />
        </PageContainer>
      )}
      {tab === 'terminal' && (
        <PageContainer size="small" className="py-8">
          <div className="rounded-md border border-default bg-surface-100 px-6 py-12 text-center">
            <p className="text-sm text-foreground">Terminal is coming soon</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-foreground-lighter">
              An interactive shell into your worker's microVM is in private alpha. It'll let you run
              commands, inspect the filesystem, and tail processes without redeploying.
            </p>
          </div>
        </PageContainer>
      )}
      {tab === 'settings' && <WorkerSettingsTab projectRef={projectRef} worker={worker} />}
    </div>
  )
}
