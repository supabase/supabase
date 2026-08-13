import { useParams } from 'common'
import {
  Check,
  ChevronRight,
  Copy,
  Cpu,
  Layers,
  Lock,
  MapPin,
  Pause,
  Play,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import { parseAsStringEnum, useQueryState } from 'nuqs'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  cn,
  copyToClipboard,
  NavMenu,
  NavMenuItem,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'ui'

import {
  WORKERS_REGION_LABEL,
  getSizeMeta,
  workerGatewayUrl,
} from '../Workers.constants'
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

type WorkerTab = 'overview' | 'logs' | 'terminal' | 'settings'
const WORKER_TABS: WorkerTab[] = ['overview', 'logs', 'terminal', 'settings']

export const WorkerDetail = () => {
  const { ref, name } = useParams()
  const projectRef = ref as string
  const workerName = name as string

  const [tab, setTab] = useQueryState(
    'tab',
    parseAsStringEnum<WorkerTab>(WORKER_TABS).withDefault('overview').withOptions({ history: 'push' })
  )
  const [isUrlCopied, setIsUrlCopied] = useState(false)

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

  const size = getSizeMeta(worker.size)
  const gatewayUrl = workerGatewayUrl(worker.name)
  const isActive = worker.state === 'active'
  const isSuspended = worker.state === 'suspended'

  const handleCopyUrl = () => {
    setIsUrlCopied(true)
    copyToClipboard(gatewayUrl)
    setTimeout(() => setIsUrlCopied(false), 2000)
  }

  const handleSimulateTraffic = () => {
    const requests = simulateTraffic(projectRef, worker.id)
    if (requests > 0) toast.success(`Simulated ${requests.toLocaleString()} requests`)
    else toast.info('Traffic can only be simulated on an active worker')
  }

  return (
    <div className="flex w-full min-h-full flex-col">
      {/* Header */}
      <div className="space-y-4 border-b border-default px-6 py-5">
        <div className="flex items-center justify-between">
          <nav className="flex items-center gap-1.5 text-sm text-foreground-lighter">
            <Link
              href={`/project/${projectRef}/workers`}
              className="transition-colors hover:text-foreground-light"
            >
              Workers
            </Link>
            <ChevronRight size={14} />
            <span className="text-foreground-light">{worker.name}</span>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="text"
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
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl text-foreground">{worker.name}</h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-foreground-lighter">
            <WorkerStatePill state={worker.state} />
            <RuntimeBadge runtime={worker.runtime} />
            {worker.access === 'public' ? (
              <Badge variant="success">Public</Badge>
            ) : (
              <Badge>Private</Badge>
            )}
            <span className="flex items-center gap-1.5">
              <Cpu size={14} />
              {size.vcpu} · {size.memory}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin size={14} />
              {WORKERS_REGION_LABEL} <span className="text-foreground-muted">(locked)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Layers size={14} />
              {worker.instances} instance{worker.instances === 1 ? '' : 's'}
            </span>
          </div>

          {/* Gateway URL */}
          <div className="flex flex-col gap-2 rounded-md border border-default bg-surface-100 px-3 py-2 sm:flex-row sm:items-center">
            <Lock size={14} className="hidden shrink-0 text-foreground-lighter sm:block" />
            <span className="flex-1 truncate font-mono text-sm text-foreground-light">
              {gatewayUrl}
            </span>
            <div className="flex items-center gap-3">
              <span className="whitespace-nowrap text-xs text-foreground-lighter">
                Gateway auth required
              </span>
              <button
                type="button"
                aria-label="Copy URL"
                onClick={handleCopyUrl}
                className="text-foreground-lighter transition-colors hover:text-foreground"
              >
                {isUrlCopied ? (
                  <Check size={14} className="text-brand" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="whitespace-nowrap text-xs text-foreground-light transition-colors hover:text-foreground"
                  >
                    How to call
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[420px] p-4">
                  <WorkerSnippetTabs
                    input={{
                      name: worker.name,
                      runtime: worker.runtime,
                      size: worker.size,
                      access: worker.access,
                      instances: worker.instances,
                    }}
                    tabs={['curl', 'cli']}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <NavMenu aria-label="Worker views">
          <NavMenuItem active={tab === 'overview'}>
            <button type="button" onClick={() => setTab('overview')}>
              Overview
            </button>
          </NavMenuItem>
          <NavMenuItem active={tab === 'logs'}>
            <button type="button" onClick={() => setTab('logs')}>
              Logs
            </button>
          </NavMenuItem>
          <NavMenuItem active={tab === 'terminal'}>
            <button
              type="button"
              onClick={() => setTab('terminal')}
              className="flex items-center gap-1.5"
            >
              Terminal
              <span className="rounded-full border border-strong px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-foreground-lighter">
                Soon
              </span>
            </button>
          </NavMenuItem>
          <NavMenuItem active={tab === 'settings'}>
            <button type="button" onClick={() => setTab('settings')}>
              Settings
            </button>
          </NavMenuItem>
        </NavMenu>
      </div>

      {/* Tab content */}
      <div className={cn('flex-1', tab === 'logs' ? 'min-h-0' : 'px-6 py-6')}>
        {tab === 'overview' && <WorkerOverviewTab projectRef={projectRef} worker={worker} />}
        {tab === 'logs' && <WorkerLogsTab projectRef={projectRef} workerName={worker.name} />}
        {tab === 'terminal' && (
          <div className="mx-6 my-6 rounded-md border border-default bg-surface-100 px-6 py-12 text-center">
            <p className="text-sm text-foreground">Terminal is coming soon</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-foreground-lighter">
              An interactive shell into your worker's microVM is in private alpha. It'll let you run
              commands, inspect the filesystem, and tail processes without redeploying.
            </p>
          </div>
        )}
        {tab === 'settings' && <WorkerSettingsTab worker={worker} />}
      </div>
    </div>
  )
}
