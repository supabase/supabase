import { useParams } from 'common'
import dayjs from 'dayjs'
import { ChevronDownIcon, HeartPulseIcon, PlayIcon } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
  Card,
  CardContent,
  cn,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from 'ui'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'
import { Markdown } from 'ui-patterns/Markdown'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import AiSreLayout from '@/components/layouts/AiSreLayout/AiSreLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { AlertError } from '@/components/ui/AlertError'
import { useAiSreConfigQuery } from '@/data/ai-sre/ai-sre-config-query'
import { useAiSreRunInsertMutation } from '@/data/ai-sre/ai-sre-run-insert-mutation'
import { useAiSreRunMutation, type AiSreRunEvent } from '@/data/ai-sre/ai-sre-run-mutation'
import { useAiSreRunsQuery } from '@/data/ai-sre/ai-sre-runs-query'
import type { AiSreFinding, AiSreRun, AiSreRunStatus } from '@/data/ai-sre/ai-sre.types'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { getGithubToken } from '@/lib/ai-sre/session-credentials'
import { useTrack } from '@/lib/telemetry/track'
import type { NextPageWithLayout } from '@/types'

const STATUS_VARIANT: Record<AiSreRunStatus, 'success' | 'warning' | 'destructive'> = {
  success: 'success',
  partial: 'warning',
  failed: 'destructive',
}

type Severity = AiSreFinding['severity']
const SEVERITY_ORDER: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 }
const SEVERITY_VARIANT: Record<Severity, 'destructive' | 'warning' | 'default'> = {
  critical: 'destructive',
  high: 'destructive',
  medium: 'warning',
  low: 'default',
}
const SEVERITY_SORTED: Severity[] = ['critical', 'high', 'medium', 'low']

const FindingsView = ({
  findings,
  summaryMd,
  confidence,
}: {
  findings: AiSreFinding[]
  summaryMd: string
  confidence: number | null
}) => {
  const sorted = [...findings].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  )
  const counts = findings.reduce<Partial<Record<Severity, number>>>((acc, f) => {
    acc[f.severity] = (acc[f.severity] ?? 0) + 1
    return acc
  }, {})

  if (findings.length === 0) {
    return (
      <div className="prose prose-sm max-w-none text-foreground-light">
        <Markdown content={summaryMd} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {SEVERITY_SORTED.filter((s) => counts[s]).map((s) => (
          <Badge key={s} variant={SEVERITY_VARIANT[s]}>
            {counts[s]} {s}
          </Badge>
        ))}
        {confidence !== null && (
          <span className="text-xs text-foreground-light">
            confidence {Math.round(confidence * 100)}%
          </span>
        )}
      </div>

      <div className="flex flex-col divide-y rounded-md border">
        {sorted.map((finding, index) => (
          <Collapsible key={index}>
            <CollapsibleTrigger className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-surface-100">
              <Badge variant={SEVERITY_VARIANT[finding.severity]}>{finding.severity}</Badge>
              <span className="shrink-0 text-sm text-foreground">{finding.surface}</span>
              <span className="flex-1 truncate text-sm text-foreground-light">
                {finding.symptom}
              </span>
              <ChevronDownIcon size={14} className="shrink-0 text-foreground-light" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 bg-surface-100 px-3 py-3 text-sm">
              <p className="text-foreground">{finding.symptom}</p>
              {finding.evidence && (
                <div>
                  <span className="text-xs font-medium uppercase tracking-wide text-foreground-light">
                    Evidence
                  </span>
                  <p className="whitespace-pre-wrap text-foreground-light">{finding.evidence}</p>
                </div>
              )}
              {finding.recommendation && (
                <div>
                  <span className="text-xs font-medium uppercase tracking-wide text-foreground-light">
                    Recommendation
                  </span>
                  <p className="whitespace-pre-wrap text-foreground-light">
                    {finding.recommendation}
                  </p>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>

      <Collapsible>
        <CollapsibleTrigger className="self-start text-sm text-foreground-light hover:text-foreground">
          View full report
        </CollapsibleTrigger>
        <CollapsibleContent className="prose prose-sm max-w-none pt-2 text-foreground-light">
          <Markdown content={summaryMd} />
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

type ConsoleEntryKind = 'text' | 'tool-call' | 'tool-result' | 'tool-error' | 'error' | 'finish'
interface ConsoleEntry {
  kind: ConsoleEntryKind
  text: string
}

const CONSOLE_STYLES: Record<ConsoleEntryKind, string> = {
  text: 'text-foreground',
  'tool-call': 'text-brand-600',
  'tool-result': 'text-foreground-light',
  'tool-error': 'text-warning',
  error: 'text-destructive',
  finish: 'text-foreground-muted',
}

const CONSOLE_PREFIX: Record<ConsoleEntryKind, string> = {
  text: '',
  'tool-call': '→ ',
  'tool-result': '← ',
  'tool-error': '✗ ',
  error: '⚠ ',
  finish: '— ',
}

/** Fold a transcript into console entries, coalescing consecutive text deltas. */
const toConsoleEntries = (events: AiSreRunEvent[]): ConsoleEntry[] => {
  const entries: ConsoleEntry[] = []
  for (const event of events) {
    if (event.type === 'reasoning') continue
    if (event.type === 'text') {
      const last = entries[entries.length - 1]
      if (last?.kind === 'text') last.text += event.text
      else entries.push({ kind: 'text', text: event.text })
    } else if (event.type === 'tool-call') {
      entries.push({ kind: 'tool-call', text: `${event.toolName}  ${event.input}` })
    } else if (event.type === 'tool-result') {
      entries.push({ kind: 'tool-result', text: `${event.toolName}  ${event.output}` })
    } else if (event.type === 'tool-error') {
      entries.push({ kind: 'tool-error', text: `${event.toolName}  ${event.error}` })
    } else if (event.type === 'error') {
      entries.push({ kind: 'error', text: event.message })
    } else if (event.type === 'finish') {
      entries.push({ kind: 'finish', text: `run finished (${event.finishReason ?? 'done'})` })
    }
  }
  return entries
}

const ConsoleView = ({ entries }: { entries: ConsoleEntry[] }) => (
  <div className="max-h-96 overflow-auto rounded-md border bg-surface-100 p-4 font-mono text-xs leading-relaxed">
    {entries.map((entry, index) => (
      <div
        key={index}
        className={cn('whitespace-pre-wrap break-words', CONSOLE_STYLES[entry.kind])}
      >
        {CONSOLE_PREFIX[entry.kind]}
        {entry.text}
      </div>
    ))}
  </div>
)

const AiSreOverviewPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams()
  const track = useTrack()
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([])
  const consoleScrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll only the console container (not the page) to the latest line.
  useEffect(() => {
    const el = consoleScrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [consoleEntries])

  const appendConsoleEvent = (event: AiSreRunEvent) => {
    setConsoleEntries((prev) => {
      switch (event.type) {
        case 'reasoning':
          return prev
        case 'text': {
          const last = prev[prev.length - 1]
          if (last?.kind === 'text') {
            return [...prev.slice(0, -1), { kind: 'text', text: last.text + event.text }]
          }
          return [...prev, { kind: 'text', text: event.text }]
        }
        case 'tool-call':
          return [...prev, { kind: 'tool-call', text: `${event.toolName}  ${event.input}` }]
        case 'tool-result':
          return [...prev, { kind: 'tool-result', text: `${event.toolName}  ${event.output}` }]
        case 'tool-error':
          return [...prev, { kind: 'tool-error', text: `${event.toolName}  ${event.error}` }]
        case 'error':
          return [...prev, { kind: 'error', text: event.message }]
        case 'finish':
          return [
            ...prev,
            { kind: 'finish', text: `run finished (${event.finishReason ?? 'done'})` },
          ]
        default:
          return prev
      }
    })
  }
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()

  const connectionString = project?.connectionString

  const {
    data: config,
    isPending: isConfigPending,
    isError: isConfigError,
    error: configError,
  } = useAiSreConfigQuery({ projectRef: ref, connectionString })

  const { data: runs = [], isPending: isRunsPending } = useAiSreRunsQuery(
    { projectRef: ref, connectionString },
    { enabled: !!config?.enabled }
  )

  const { mutateAsync: runAiSre, isPending: isRunningAgent } = useAiSreRunMutation()
  const { mutateAsync: insertRun, isPending: isSavingRun } = useAiSreRunInsertMutation()
  const isRunning = isRunningAgent || isSavingRun

  const latestRun: AiSreRun | undefined = runs[0]

  const handleRunNow = async () => {
    if (!ref || !connectionString || !config) return
    const githubToken = getGithubToken(ref)
    track('ai_sre_run_button_clicked', {
      githubAccessLevel: config.githubAccessLevel,
      hasGithubConnection: !!githubToken,
    })
    setConsoleEntries([])
    const transcript: AiSreRunEvent[] = []
    try {
      const report = await runAiSre({
        projectRef: ref,
        connectionString,
        orgSlug: organization?.slug,
        focusAreas: config.focusAreas,
        githubAccessLevel: config.githubAccessLevel,
        githubToken,
        onEvent: (event) => {
          transcript.push(event)
          appendConsoleEvent(event)
        },
      })
      await insertRun({
        projectRef: ref,
        connectionString,
        run: {
          trigger: 'manual',
          status: report.status,
          summaryMd: report.summaryMd,
          findings: report.findings,
          confidence: report.confidence,
          githubPrUrl: null,
          finished: true,
          transcript,
        },
      })
      toast.success('AI SRE run complete')
    } catch {
      // Errors are surfaced via the mutation onError toasts.
    }
  }

  if (isConfigPending) {
    return (
      <PageContainer size="large">
        <GenericSkeletonLoader />
      </PageContainer>
    )
  }

  if (isConfigError) {
    return (
      <PageContainer size="large">
        <AlertError error={configError} subject="Failed to load AI SRE configuration" />
      </PageContainer>
    )
  }

  if (!config?.enabled) {
    return (
      <PageContainer size="large">
        <EmptyStatePresentational
          icon={HeartPulseIcon}
          title="Enable the Supabase SRE"
          description="A site reliability engineer for your project. It watches for problems before your users do, keeps your project stable and secure, and reports what it finds on a schedule you set."
        >
          <Button variant="primary" onClick={() => router.push(`/project/${ref}/ai-sre/settings`)}>
            Set up AI SRE
          </Button>
        </EmptyStatePresentational>
      </PageContainer>
    )
  }

  return (
    <PageContainer size="large">
      <PageHeader>
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>AI SRE</PageHeaderTitle>
            <PageHeaderDescription>
              Your project's site reliability engineer. Runs on a {config.cadence} cadence.
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>

      <div className="flex flex-col gap-6 py-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="text-sm text-foreground-light">Last run</span>
              <span className="text-xl text-foreground">
                {latestRun ? dayjs(latestRun.startedAt).fromNow() : 'Never'}
              </span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="text-sm text-foreground-light">Last status</span>
              <span className="text-xl text-foreground">
                {latestRun ? (
                  <Badge variant={STATUS_VARIANT[latestRun.status]}>{latestRun.status}</Badge>
                ) : (
                  '—'
                )}
              </span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="text-sm text-foreground-light">Findings in last run</span>
              <span className="text-xl text-foreground">
                {latestRun ? latestRun.findings.length : '—'}
              </span>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-base text-foreground">Run history</h2>
          <Button
            variant="primary"
            icon={<PlayIcon />}
            loading={isRunning}
            disabled={isRunning}
            onClick={handleRunNow}
          >
            {isRunning ? 'Running…' : 'Run now'}
          </Button>
        </div>

        {(isRunning || consoleEntries.length > 0) && (
          <Card>
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b px-4 py-2">
                <span className="text-xs font-medium uppercase tracking-wide text-foreground-light">
                  Run console
                </span>
                {isRunning && <Badge variant="default">Running</Badge>}
              </div>
              <div
                ref={consoleScrollRef}
                className="h-[28rem] overflow-y-auto bg-surface-100 p-4 font-mono text-xs leading-relaxed"
              >
                {consoleEntries.length === 0 && (
                  <span className="text-foreground-muted">Starting the agent…</span>
                )}
                {consoleEntries.map((entry, index) => (
                  <div
                    key={index}
                    className={cn('whitespace-pre-wrap break-words', CONSOLE_STYLES[entry.kind])}
                  >
                    {CONSOLE_PREFIX[entry.kind]}
                    {entry.text}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {isRunsPending && <GenericSkeletonLoader />}

        {!isRunsPending && runs.length === 0 && (
          <Card>
            <CardContent className="p-6 text-sm text-foreground-light">
              No runs yet. Run the SRE now, or wait for the next scheduled run.
            </CardContent>
          </Card>
        )}

        {!isRunsPending && runs.length > 0 && (
          <Accordion type="single" collapsible className="rounded-md border bg-surface-100">
            {runs.map((run) => (
              <AccordionItem key={run.id} value={run.id} className="px-4">
                <AccordionTrigger className="gap-3">
                  <div className="flex flex-1 items-center justify-between pr-3">
                    <span className="text-sm text-foreground">
                      {dayjs(run.startedAt).format('MMM D, YYYY HH:mm')}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-foreground-light capitalize">
                        {run.trigger}
                      </span>
                      <Badge variant={STATUS_VARIANT[run.status]}>{run.status}</Badge>
                      <span className="text-xs text-foreground-light">
                        {run.findings.length} finding{run.findings.length === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pb-4">
                    <FindingsView
                      findings={run.findings}
                      summaryMd={run.summaryMd}
                      confidence={run.confidence}
                    />
                  </div>
                  {run.transcript.length > 0 && (
                    <div className="pb-4">
                      <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-foreground-light">
                        Run console
                      </span>
                      <ConsoleView entries={toConsoleEntries(run.transcript)} />
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </PageContainer>
  )
}

AiSreOverviewPage.getLayout = (page) => (
  <DefaultLayout>
    <AiSreLayout title="AI SRE">{page}</AiSreLayout>
  </DefaultLayout>
)

export default AiSreOverviewPage
