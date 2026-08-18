import { useParams } from 'common'
import dayjs from 'dayjs'
import { Clock, Container, Copy, Info, Pause, Play, Zap } from 'lucide-react'
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
  Card,
  NavMenu,
  NavMenuItem,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { PageBreadcrumbs, PageBreadcrumbsActions } from 'ui-patterns/PageBreadcrumbs'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderDescription,
  PageHeaderIcon,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageNav } from 'ui-patterns/PageNav'

import { RuntimeBadge } from '../RuntimeBadge'
import { WorkerSnippetTabs } from '../WorkerSnippetTabs'
import { WorkerStatePill } from '../WorkerStatePill'
import { WorkerLogsTab } from './WorkerLogsTab'
import { WorkerOverviewTab } from './WorkerOverviewTab'
import { WorkerSettingsTab } from './WorkerSettingsTab'
import { PRODUCT_NAME } from '@/lib/constants/workers'
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
          <Link href={`/project/${projectRef}/workers`}>Back to {PRODUCT_NAME}</Link>
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
    <div className="w-full min-h-full flex flex-col items-stretch">
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
              <Link href={`/project/${projectRef}/workers`}>{PRODUCT_NAME}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{worker.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </PageBreadcrumbs>

      {/* Worker title + summary, aligned with the breadcrumb/nav gutters */}
      <PageHeader className="py-4 [&>div]:px-4 [&>div]:xl:px-4">
        <PageHeaderMeta className="px-0 xl:px-0">
          <PageHeaderIcon>
            <Card className="flex h-14 w-14 shrink-0 items-center justify-center">
              <Container className="h-5 w-5" />
            </Card>
          </PageHeaderIcon>
          <PageHeaderSummary>
            <PageHeaderTitle>{worker.name}</PageHeaderTitle>
            <PageHeaderDescription className="flex flex-row flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <WorkerStatePill state={worker.state} />
              <RuntimeBadge runtime={worker.runtime} />
              <span className="flex items-center gap-2 text-foreground-light">
                <Clock size={14} strokeWidth={1.5} className="text-foreground-lighter" />
                Last deployed {dayjs(worker.updatedAt).format('MMM D, YYYY HH:mm')}
              </span>
            </PageHeaderDescription>
          </PageHeaderSummary>
          <PageHeaderAside>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="default" icon={<Copy size={14} />}>
                  How to call
                </Button>
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
          </PageHeaderAside>
        </PageHeaderMeta>
      </PageHeader>
      <PageNav>
        <NavMenu>
          {TAB_ORDER.map((item) =>
            item === 'terminal' ? (
              <NavMenuItem key="terminal" active={false}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex h-full items-center gap-1 text-foreground-muted/70">
                      Terminal
                      <Info size={12} />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top">Coming soon</TooltipContent>
                </Tooltip>
              </NavMenuItem>
            ) : (
              <NavMenuItem key={item} active={tab === item}>
                <button type="button" tabIndex={0} onClick={() => setTab(item)}>
                  {TAB_LABEL[item]}
                </button>
              </NavMenuItem>
            )
          )}
        </NavMenu>
      </PageNav>

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
