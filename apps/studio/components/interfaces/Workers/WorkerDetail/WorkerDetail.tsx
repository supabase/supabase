import { useParams } from 'common'
import dayjs from 'dayjs'
import { Clock, Copy, Pause, Play, Zap } from 'lucide-react'
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
  copyToClipboard,
  NavMenu,
  NavMenuItem,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderBreadcrumb,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderNavigationTabs,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import { workerGatewayUrl } from '../Workers.constants'
import { RuntimeBadge } from '../RuntimeBadge'
import { WorkerSnippetTabs } from '../WorkerSnippetTabs'
import { WorkerStatePill } from '../WorkerStatePill'
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

type WorkerTab = 'overview' | 'logs' | 'settings'
const WORKER_TABS: WorkerTab[] = ['overview', 'logs', 'settings']

// Display order for the nav — Terminal is a disabled placeholder second to last.
const TAB_ORDER: Array<WorkerTab | 'terminal'> = ['overview', 'logs', 'terminal', 'settings']

const TAB_LABEL: Record<WorkerTab, string> = {
  overview: 'Overview',
  logs: 'Logs',
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

  const gatewayUrl = workerGatewayUrl(worker.name)
  const isActive = worker.state === 'active'
  const isSuspended = worker.state === 'suspended'

  const handleSimulateTraffic = () => {
    const requests = simulateTraffic(projectRef, worker.id)
    if (requests > 0) toast.success(`Simulated ${requests.toLocaleString()} requests`)
    else toast.info('Traffic can only be simulated on an active worker')
  }

  return (
    <div className="w-full min-h-full flex flex-col items-stretch">
      <PageHeader size="full">
        <PageHeaderBreadcrumb>
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
        </PageHeaderBreadcrumb>

        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>{worker.name}</PageHeaderTitle>
            <PageHeaderDescription className="flex flex-row flex-wrap items-center gap-x-4 gap-y-1 text-sm!">
              <span className="flex items-center gap-2">
                <span className="font-mono text-foreground-light">{gatewayUrl}</span>
                <button
                  type="button"
                  aria-label="Copy URL"
                  onClick={() => copyToClipboard(gatewayUrl)}
                  className="text-foreground-lighter transition-colors hover:text-foreground"
                >
                  <Copy size={13} />
                </button>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="text-xs text-foreground-light transition-colors hover:text-foreground"
                    >
                      How to call
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-[440px] p-4">
                    <WorkerSnippetTabs
                      input={{
                        name: worker.name,
                        runtime: worker.runtime,
                        size: worker.size,
                        access: worker.access,
                        instances: worker.instances,
                      }}
                      tabs={['curl', 'js', 'python']}
                    />
                  </PopoverContent>
                </Popover>
              </span>
              <WorkerStatePill state={worker.state} />
              <RuntimeBadge runtime={worker.runtime} />
              <span className="flex items-center gap-2 text-foreground-light">
                <Clock size={14} strokeWidth={1.5} className="text-foreground-lighter" />
                Last deployed {dayjs(worker.updatedAt).format('MMM D, YYYY HH:mm')}
              </span>
            </PageHeaderDescription>
          </PageHeaderSummary>

          <PageHeaderAside>
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                icon={<Zap size={14} />}
                disabled={!isActive}
                onClick={handleSimulateTraffic}
              >
                Simulate traffic
              </Button>
              {isActive && (
                <Button
                  variant="default"
                  icon={<Pause size={14} />}
                  onClick={() => suspendWorker(projectRef, worker.id)}
                >
                  Suspend
                </Button>
              )}
              {isSuspended && (
                <Button
                  variant="default"
                  icon={<Play size={14} />}
                  onClick={() => resumeWorker(projectRef, worker.id)}
                >
                  Resume
                </Button>
              )}
            </div>
          </PageHeaderAside>
        </PageHeaderMeta>

        <PageHeaderNavigationTabs>
          <NavMenu>
            {TAB_ORDER.map((item) =>
              item === 'terminal' ? (
                <NavMenuItem key="terminal" active={false}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex h-full cursor-not-allowed items-center gap-1.5 text-foreground-muted">
                        Terminal
                        <span className="rounded-full border border-strong px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-foreground-lighter">
                          Soon
                        </span>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Coming soon in private alpha</TooltipContent>
                  </Tooltip>
                </NavMenuItem>
              ) : (
                <NavMenuItem key={item} active={tab === item}>
                  <button type="button" onClick={() => setTab(item)}>
                    {TAB_LABEL[item]}
                  </button>
                </NavMenuItem>
              )
            )}
          </NavMenu>
        </PageHeaderNavigationTabs>
      </PageHeader>

      {tab === 'overview' && <WorkerOverviewTab projectRef={projectRef} worker={worker} />}
      {tab === 'logs' && (
        <PageContainer size="full" className="px-0 xl:px-0">
          <WorkerLogsTab projectRef={projectRef} workerName={worker.name} />
        </PageContainer>
      )}
      {tab === 'settings' && <WorkerSettingsTab projectRef={projectRef} worker={worker} />}
    </div>
  )
}
