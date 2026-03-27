'use client'

import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { useCheckOpenAIKeyQuery } from 'data/ai/check-api-key-query'
import { useHomeSummaryQuery } from 'data/ai/home-summary-query'
import type { Lint } from 'data/lint/lint-query'
import { useOrgAiOptInLevel } from 'hooks/misc/useOrgOptedIntoAi'
import { isKnownAssistantModelId } from 'lib/ai/model.utils'
import { DOCS_URL, IS_PLATFORM, PROJECT_STATUS } from 'lib/constants'
import { Info } from 'lucide-react'
import { useMemo } from 'react'
import { useAiAssistantState, useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { AiIconAnimation, Button, cn, HoverCard, HoverCardContent, HoverCardTrigger } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import type { useV2DataCounts } from './useV2DataCounts'

/** Shapes returned by parseInfrastructureMetrics / parseConnectionsData in HomeView. */
type SummaryInfrastructureMetrics = {
  cpu: { current: number; max: number }
  ram: { current: number; max: number }
  disk: { current: number; max: number }
  diskIo: { current: number; max: number }
}
type SummaryConnections = { current: number; max: number }
type V2Counts = ReturnType<typeof useV2DataCounts>

/** Room for capacity + advisors; trimmed by dropping whole sections (no ellipsis). */
const DEFAULT_MAX_SUMMARY_CHARS = 520

const DOC_LINKS = {
  databaseLinter: `${DOCS_URL}/guides/database/database-linter`,
  advisorsOverview: `${DOCS_URL}/guides/database/database-advisors`,
  queryPerformance: `${DOCS_URL}/guides/database/query-performance`,
  connectionPooling: `${DOCS_URL}/guides/database/connection-management`,
  rls: `${DOCS_URL}/guides/database/postgres/row-level-security`,
  logs: `${DOCS_URL}/guides/platform/logs`,
  diskIo: `${DOCS_URL}/guides/platform/compute-add-ons#disk-io`,
}

function normalizeLintParagraph(text: string | undefined): string {
  if (!text) return ''
  return text.replace(/\s+/g, ' ').trim()
}

/**
 * Remove URLs and unwrap [label](url) so the on-card summary stays readable.
 * If the visible label looks like a bare URL, replace with a short Studio-oriented hint.
 */
function stripLinksForSummary(text: string | undefined): string {
  let t = normalizeLintParagraph(text)
  if (!t) return ''
  t = t.replace(/\[([^\]]*)\]\([^)]+\)/g, (_, label: string) => {
    const l = label.trim()
    if (!l || /^https?:\/\//i.test(l)) return 'View docs'
    return l
  })
  t = t
    .replace(/https?:\/\/[^\s)]+/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
  return t
}

/**
 * Take leading complete sentences only; each sentence must fit entirely within maxChars for
 * the running total (no truncated clauses, no ellipsis).
 */
function completeSentencesUpTo(text: string, maxTotalChars: number): string {
  const cleaned = stripLinksForSummary(text)
  if (!cleaned) return ''
  const rawSentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)

  const sentences: string[] = []
  for (const s of rawSentences) {
    const endsWell = /[.!?]$/.test(s)
    const piece = endsWell ? s : `${s}.`
    if (piece.length > maxTotalChars) break
    const candidate = sentences.length === 0 ? piece : `${sentences.join(' ')} ${piece}`
    if (candidate.length <= maxTotalChars) sentences.push(piece)
    else break
  }

  if (sentences.length > 0) return sentences.join(' ')

  // Single block with no sentence breaks: only use if the whole thing fits.
  if (cleaned.length <= maxTotalChars && /[.!?]$/.test(cleaned)) return cleaned
  return ''
}

/** Drop trailing sections until the joined text fits the card budget (no ellipsis). */
function joinSummarySections(sections: string[], maxChars: number): string {
  const trimmed = sections.map((s) => s.trim()).filter(Boolean)
  for (let n = trimmed.length; n >= 1; n--) {
    const joined = trimmed.slice(0, n).join(' ')
    if (joined.length <= maxChars) return joined
  }
  return trimmed[0] ?? ''
}

/** Trim model text to the card budget without mid-sentence cut when possible. */
function clampPlainSummary(text: string, maxChars: number): string {
  const t = text.replace(/\s+/g, ' ').trim()
  if (t.length <= maxChars) return t
  const slice = t.slice(0, maxChars)
  const lastBreak = Math.max(
    slice.lastIndexOf('. '),
    slice.lastIndexOf('! '),
    slice.lastIndexOf('? ')
  )
  const lastSpace = slice.lastIndexOf(' ')
  const cutAt =
    lastBreak > maxChars * 0.5 ? lastBreak + 1 : lastSpace > maxChars * 0.55 ? lastSpace : maxChars
  return slice.slice(0, cutAt).trim()
}

function lintScopeLabel(l: Lint): string | null {
  const { schema, name: entity } = l.metadata ?? {}
  if (schema && entity) return `${schema}.${entity}`
  if (entity) return entity
  return null
}

/**
 * Order: errors before warnings; for the same level, SECURITY before PERFORMANCE.
 * Spotlight the first few for the card blurb.
 */
function prioritizedLints(lints: Lint[]): Lint[] {
  const levelRank = (lv: Lint['level']) => (lv === 'ERROR' ? 0 : lv === 'WARN' ? 1 : 2)
  const catRank = (l: Lint) => (l.categories.includes('SECURITY') ? 0 : 1)
  return [...lints].sort((a, b) => {
    const lr = levelRank(a.level) - levelRank(b.level)
    if (lr !== 0) return lr
    return catRank(a) - catRank(b)
  })
}

/**
 * Finding line: severity + title + scope, then description and remediation from the API only.
 */
function buildFindingElaboration(l: Lint, budget: number, findingIndex: number): string {
  const title = normalizeLintParagraph(l.title) || l.name.replaceAll('_', ' ')
  const scope = lintScopeLabel(l)
  const severity = l.level === 'ERROR' ? 'Error' : 'Warning'
  const where = scope ? ` — ${scope}` : ''

  const openers = [
    `${severity}: ${title}${where}.`,
    `${severity} — ${title}${where}.`,
    `${title}${where} (${severity.toLowerCase()}).`,
  ]
  const opener = openers[Math.min(findingIndex, openers.length - 1)]

  const riskCap = Math.max(100, Math.floor(budget * 0.48))
  const fixCap = Math.max(90, Math.floor(budget * 0.44))
  const risk =
    completeSentencesUpTo(l.description ?? '', riskCap) ||
    completeSentencesUpTo(l.detail ?? '', riskCap)
  const fix = completeSentencesUpTo(l.remediation ?? '', fixCap)

  const parts = [opener]
  if (risk) {
    parts.push(risk)
  }
  if (fix) {
    parts.push(fix)
  }

  return joinSummarySections(parts, budget)
}

/** Mix security and performance findings when space allows. */
function pickFindingsForCardDetail(
  securityFindings: Lint[],
  performanceFindings: Lint[],
  max: number
): Lint[] {
  const out: Lint[] = []
  if (securityFindings[0]) out.push(securityFindings[0])
  if (performanceFindings[0]) out.push(performanceFindings[0])
  let si = 1
  let pi = 1
  while (out.length < max) {
    if (securityFindings[si]) out.push(securityFindings[si++])
    else if (performanceFindings[pi]) out.push(performanceFindings[pi++])
    else break
  }
  return out
}

/**
 * Advisor narrative: concise, neutral, documentation-style copy + API sentences (deterministic).
 */
function buildAdvisorResilienceNarrative({
  lints,
  secErr,
  secWarn,
  perfErr,
  perfWarn,
  summaryCharBudget,
}: {
  lints: Lint[]
  secErr: number
  secWarn: number
  perfErr: number
  perfWarn: number
  summaryCharBudget: number
}): string {
  const relevant = prioritizedLints(lints.filter((l) => l.level === 'ERROR' || l.level === 'WARN'))
  const securityFindings = relevant.filter((l) => l.categories.includes('SECURITY'))
  const performanceFindings = relevant.filter(
    (l) => l.categories.includes('PERFORMANCE') && !l.categories.includes('SECURITY')
  )

  const errTotal = secErr + perfErr
  const warnTotal = secWarn + perfWarn
  const anyErrors = errTotal > 0

  const maxDetails = summaryCharBudget >= 400 ? 2 : 1
  const detailTargets = pickFindingsForCardDetail(securityFindings, performanceFindings, maxDetails)
  const perFindingBudget = Math.max(
    145,
    Math.floor((summaryCharBudget - 220) / Math.max(detailTargets.length, 1))
  )

  let lead: string
  if (!anyErrors) {
    lead = `No linter errors; ${warnTotal} warning${warnTotal === 1 ? '' : 's'}.`
  } else {
    lead = `The database linter reports ${errTotal} error${errTotal === 1 ? '' : 's'} and ${warnTotal} warning${warnTotal === 1 ? '' : 's'}.`
  }

  const sections: string[] = [lead]

  if (securityFindings.length > 0 && performanceFindings.length > 0) {
    sections.push(`Security: access and RLS. Performance: queries and indexes.`)
  } else if (securityFindings.length > 0) {
    sections.push(`Security: access and RLS.`)
  } else if (performanceFindings.length > 0) {
    sections.push(`Performance: queries and indexes.`)
  }

  detailTargets.forEach((lint, i) => {
    sections.push(buildFindingElaboration(lint, perFindingBudget, i))
  })

  const remaining = securityFindings.length + performanceFindings.length - detailTargets.length
  if (remaining > 0) {
    sections.push(
      `You have ${remaining} more finding${remaining === 1 ? '' : 's'} in the Advisors panel with full detail.`
    )
  }

  sections.push(
    `Use Tell me more for a guided walkthrough, or open the Database linter documentation for each rule.`
  )

  return joinSummarySections(sections, summaryCharBudget)
}

/** Database and connection utilization for cost and capacity (24h-style averages). */
function buildCapacityInsights(
  metrics: SummaryInfrastructureMetrics | null,
  connections: SummaryConnections
): string[] {
  if (!metrics) return []

  const cpu = metrics.cpu.current
  const ram = metrics.ram.current
  const disk = metrics.disk.current
  const diskIo = metrics.diskIo.current

  const connRatio = connections.max > 0 ? connections.current / Math.max(connections.max, 1) : 0
  const pct = Math.round(connRatio * 100)

  const strongPressure = cpu >= 72 || ram >= 78 || disk >= 82
  const lightPressure = cpu >= 58 || ram >= 62 || disk >= 68 || diskIo >= 55

  const parts: string[] = []

  if (strongPressure) {
    parts.push(
      `Database load is elevated in the past hour (about ${cpu.toFixed(0)}% CPU, ${ram.toFixed(0)}% memory, ${disk.toFixed(0)}% disk, ${diskIo.toFixed(0)}% disk IO).`
    )
  } else if (lightPressure) {
    parts.push(
      `Database load looks moderate (about ${cpu.toFixed(0)}% CPU, ${ram.toFixed(0)}% memory, ${disk.toFixed(0)}% disk, ${diskIo.toFixed(0)}% disk IO).`
    )
  } else {
    parts.push(
      `Database load looks light in the past hour (about ${cpu.toFixed(0)}% CPU, ${ram.toFixed(0)}% memory, ${disk.toFixed(0)}% disk, ${diskIo.toFixed(0)}% disk IO).`
    )
  }

  if (connections.max > 0) {
    if (connRatio >= 0.8) {
      parts.push(
        `Active connections average roughly ${connections.current} out of ${connections.max} (${pct}% of this project's limit), so headroom before the cap is tight. Revisit connection pooling, how long clients keep sessions open, and whether the limit still fits your plan if traffic grows.`
      )
    } else if (connRatio >= 0.55) {
      parts.push(
        `You are averaging about ${connections.current} of ${connections.max} connections (${pct}% of the limit). That is a typical band for many workloads; check again if concurrent usage is climbing.`
      )
    } else {
      parts.push(
        `Average connection use is near ${connections.current} of ${connections.max} (${pct}% of the limit), which leaves comfortable room on the current tier unless your traffic pattern changes sharply.`
      )
    }
  }

  return parts
}

function buildShortSummary({
  projectStatus,
  lints,
  lintsPending,
  metrics,
  connections,
  summaryCharBudget,
}: {
  projectStatus?: string
  lints: Lint[]
  lintsPending: boolean
  metrics: SummaryInfrastructureMetrics | null
  connections: SummaryConnections
  summaryCharBudget: number
}): string {
  if (lintsPending) {
    return 'Loading advisor results and health data for this project.'
  }

  const security = lints.filter((l) => l.categories.includes('SECURITY'))
  const performance = lints.filter((l) => l.categories.includes('PERFORMANCE'))
  const secErr = security.filter((l) => l.level === 'ERROR').length
  const secWarn = security.filter((l) => l.level === 'WARN').length
  const perfErr = performance.filter((l) => l.level === 'ERROR').length
  const perfWarn = performance.filter((l) => l.level === 'WARN').length
  const totalIssues = secErr + secWarn + perfErr + perfWarn

  const statusLower = projectStatus?.toLowerCase() ?? ''
  const unhealthy = projectStatus !== undefined && projectStatus !== PROJECT_STATUS.ACTIVE_HEALTHY

  const parts: string[] = []

  if (unhealthy && statusLower) {
    parts.push(
      `Project status is ${statusLower.replaceAll('_', ' ')}. Verify project health before you use the rest of this summary.`
    )
  }

  parts.push(...buildCapacityInsights(metrics, connections))

  if (totalIssues === 0 && !unhealthy) {
    parts.push(`Advisors report no errors or warnings.`)
    parts.push(
      `Run advisors again after schema or Row Level Security changes. Use Logs to trace unexpected behavior.`
    )
    return joinSummarySections(parts, summaryCharBudget)
  }

  if (totalIssues > 0) {
    const reserved = unhealthy ? 120 : 0
    const narrativeBudget = Math.max(220, summaryCharBudget - reserved - 380)
    parts.push(
      buildAdvisorResilienceNarrative({
        lints,
        secErr,
        secWarn,
        perfErr,
        perfWarn,
        summaryCharBudget: narrativeBudget,
      })
    )
  }

  if (parts.length === 0) {
    return 'Run advisors after notable schema changes, and review infrastructure metrics regularly.'
  }

  return joinSummarySections(parts, summaryCharBudget)
}

type HealthContextParams = {
  projectRef: string | undefined
  projectName: string | undefined
  projectStatus: string | undefined
  lints: Lint[]
  metrics: SummaryInfrastructureMetrics | null
  connections: SummaryConnections
  counts: V2Counts
  migrationLabel: string
}

/** Shared read-only context for the home card AI request and the assistant deep-dive prompt. */
function buildHealthContextMarkdown(params: HealthContextParams): string {
  const {
    projectRef,
    projectName,
    projectStatus,
    lints,
    metrics,
    connections,
    counts,
    migrationLabel,
  } = params

  const security = lints.filter((l) => l.categories.includes('SECURITY'))
  const performance = lints.filter((l) => l.categories.includes('PERFORMANCE'))

  const topLints = prioritizedLints(lints.filter((l) => l.level === 'ERROR' || l.level === 'WARN'))
    .slice(0, 12)
    .map((l) => {
      const scope = lintScopeLabel(l)
      const desc = stripLinksForSummary(l.description)
      const detail = stripLinksForSummary(l.detail)
      const remediation = stripLinksForSummary(l.remediation)
      return [
        `- **[${l.level}]** ${l.title} (\`${l.name}\`, ${l.categories.join('/')})${scope ? ` — **${scope}**` : ''}`,
        desc ? `  - Risk / context: ${desc}` : '',
        detail && detail !== desc ? `  - Detail: ${detail}` : '',
        remediation ? `  - Remediation: ${remediation}` : '',
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n\n')

  const cpu = metrics?.cpu?.current
  const ram = metrics?.ram?.current
  const disk = metrics?.disk?.current
  const diskIo = metrics?.diskIo?.current

  return `## Context (read-only)
- **Project**: ${projectName ?? 'Unknown'} (\`${projectRef ?? 'unknown'}\`)
- **Status**: ${projectStatus ?? 'unknown'}
- **Recent migration label (from dashboard)**: ${migrationLabel}
- **Approx. data counts (dashboard)**: ${counts.tables} tables, ${counts.users} auth users, ${counts.edgeFunctions} edge functions, ${counts.buckets} storage buckets
- **Connections (24h avg / limit)**: ${connections.max > 0 ? `${connections.current} / ${connections.max}` : 'n/a'}
- **Infra (24h hourly averages, %)**: CPU ${cpu != null ? `${cpu.toFixed(0)}%` : 'n/a'}, RAM ${ram != null ? `${ram.toFixed(0)}%` : 'n/a'}, disk used ${disk != null ? `${disk.toFixed(0)}%` : 'n/a'}, disk IO ${diskIo != null ? `${diskIo.toFixed(0)}%` : 'n/a'}

## Advisor issues (database linter)
Security issues: ${security.length}, Performance issues: ${performance.length}

Top issues:
${topLints || '(none in the sample; still check Security and Performance advisor pages.)'}`
}

function buildHomeSummaryCardUserPrompt(
  params: HealthContextParams & { usesMockData: boolean }
): string {
  const mockNote = params.usesMockData
    ? `Note: The metrics, connection counts, and advisor list below are **demo samples** for a local or preview build.\n\n`
    : ''
  return `${mockNote}${buildHealthContextMarkdown(params)}

Write one or two short paragraphs of plain text (no markdown, no lists) for the home card. Stay within about 520 characters total. Prioritize security and performance findings when present, then database load and connection usage.`
}

function buildDetailedAssistantPrompt(params: {
  projectRef: string | undefined
  projectName: string | undefined
  projectStatus: string | undefined
  lints: Lint[]
  metrics: SummaryInfrastructureMetrics | null
  connections: SummaryConnections
  counts: V2Counts
  migrationLabel: string
  usesMockData: boolean
}): string {
  const {
    projectRef,
    projectName,
    projectStatus,
    lints,
    metrics,
    connections,
    counts,
    migrationLabel,
    usesMockData,
  } = params

  const mockPreamble = usesMockData
    ? `Note: The metrics, connection counts, and advisor list in this message are **demo samples** for the home summary preview.\n\n`
    : ''

  return `${mockPreamble}You help users in Supabase Studio. Write like technical documentation: conversational, respectful, and easy to scan. Use clear, concise language. Prefer active voice. Define database terms briefly when they first appear (for example, Row Level Security). Avoid slang, idioms, and a pushy or overly casual tone. Focus on what the user needs to do next.

${buildHealthContextMarkdown({
  projectRef,
  projectName,
  projectStatus,
  lints,
  metrics,
  connections,
  counts,
  migrationLabel,
})}

## What to produce
1. **Executive summary** (3–5 bullets): current health, main risks, and recommended order of work.
2. **Advisor actions**: For each important issue, state the lint name, why it matters, and **one concrete next step** (for example: enable RLS, add an index, adjust a policy). Link to documentation with short link text where it helps. Reference paths: database linter ${DOC_LINKS.databaseLinter}; advisors ${DOC_LINKS.advisorsOverview}; RLS ${DOC_LINKS.rls}.
3. **Observability**: When metrics suggest stress on CPU, RAM, disk, or connections, explain likely causes in plain language. Suggest documentation with short labels (for example: query performance, connection pooling, logs). Paths: query performance ${DOC_LINKS.queryPerformance}; pooling ${DOC_LINKS.connectionPooling}; logs ${DOC_LINKS.logs}; disk and compute ${DOC_LINKS.diskIo}.
4. **Schema / SQL** (optional): When useful, suggest example SQL or \`EXPLAIN\` steps. State assumptions and avoid destructive operations.

Use **markdown** with clear headings. When context is missing, say so instead of inventing details.`
}

export function HomeViewSupaAiSummary({
  projectRef,
  projectName,
  projectStatus,
  orgSlug,
  projectDetailPending,
  organizationsPending,
  lints,
  lintsPending,
  metrics,
  connections,
  counts,
  migrationLabel,
  maxSummaryChars = DEFAULT_MAX_SUMMARY_CHARS,
  className,
  usesMockData = false,
}: {
  projectRef: string | undefined
  projectName: string | undefined
  projectStatus: string | undefined
  /** Required on hosted Studio for the home-summary API org gate. */
  orgSlug?: string
  /** While true, summary stays in loading state until project detail exists. */
  projectDetailPending?: boolean
  /** Hosted: while org list is loading, slug for the home-summary API may be unknown. */
  organizationsPending?: boolean
  lints: Lint[]
  lintsPending: boolean
  metrics: SummaryInfrastructureMetrics | null
  connections: SummaryConnections
  counts: V2Counts
  migrationLabel: string
  maxSummaryChars?: number
  className?: string
  /** When true, "Tell me more" prefaces the assistant message that metrics/advisors are demo samples. */
  usesMockData?: boolean
}) {
  const { openSidebar } = useSidebarManagerSnapshot()
  const aiAssistant = useAiAssistantState()
  const assistantSnap = useAiAssistantStateSnapshot()
  const { aiOptInLevel, isHipaaProjectDisallowed } = useOrgAiOptInLevel()
  const { data: openAiKeyCheck, isPending: openAiKeyPending } = useCheckOpenAIKeyQuery({
    enabled: !IS_PLATFORM,
  })

  const selfHostedKeysReady = IS_PLATFORM || openAiKeyCheck?.hasKey === true

  const aiAllowed = aiOptInLevel !== 'disabled' && !isHipaaProjectDisallowed && selfHostedKeysReady

  const summaryInputDigest = useMemo(
    () =>
      JSON.stringify({
        projectStatus,
        migrationLabel,
        counts: {
          tables: counts.tables,
          users: counts.users,
          edgeFunctions: counts.edgeFunctions,
          buckets: counts.buckets,
        },
        metrics,
        connections,
        lintKeys: lints.map((l) => l.cache_key).sort(),
        usesMockData,
      }),
    [
      projectStatus,
      migrationLabel,
      counts.tables,
      counts.users,
      counts.edgeFunctions,
      counts.buckets,
      metrics,
      connections,
      lints,
      usesMockData,
    ]
  )

  const cardAiUserPrompt = useMemo(() => {
    if (lintsPending) return ''
    return buildHomeSummaryCardUserPrompt({
      projectRef,
      projectName,
      projectStatus,
      lints,
      metrics,
      connections,
      counts,
      migrationLabel,
      usesMockData,
    })
  }, [
    lintsPending,
    projectRef,
    projectName,
    projectStatus,
    lints,
    metrics,
    connections,
    counts,
    migrationLabel,
    usesMockData,
  ])

  const assistantModelId =
    assistantSnap.model && isKnownAssistantModelId(assistantSnap.model)
      ? assistantSnap.model
      : undefined

  const shouldFetchHomeSummary =
    aiAllowed &&
    !lintsPending &&
    Boolean(projectRef) &&
    cardAiUserPrompt.length > 0 &&
    (IS_PLATFORM ? Boolean(orgSlug) : true)

  const {
    data: homeSummaryResult,
    isPending: homeSummaryPending,
    isFetching: homeSummaryFetching,
  } = useHomeSummaryQuery({
    projectRef: projectRef ?? '',
    orgSlug,
    prompt: cardAiUserPrompt,
    model: assistantModelId,
    inputDigest: summaryInputDigest,
    enabled: shouldFetchHomeSummary,
  })

  const contextAndAiLoading =
    !projectRef ||
    Boolean(projectDetailPending) ||
    (IS_PLATFORM && Boolean(organizationsPending)) ||
    (!IS_PLATFORM && openAiKeyPending) ||
    (aiAllowed && shouldFetchHomeSummary && (homeSummaryPending || homeSummaryFetching))

  const showSummarySkeleton = lintsPending || contextAndAiLoading

  const fallbackSummary = useMemo(
    () =>
      buildShortSummary({
        projectStatus,
        lints,
        lintsPending,
        metrics,
        connections,
        summaryCharBudget: maxSummaryChars,
      }),
    [projectStatus, lints, lintsPending, metrics, connections, maxSummaryChars]
  )

  const displaySummary = useMemo(() => {
    if (lintsPending) return ''
    const fromModel = homeSummaryResult?.summary?.trim()
    // Show model output whenever AI is allowed and we have a successful response (do not key off
    // `shouldFetchHomeSummary` alone: org slug can resolve after first paint).
    if (fromModel && aiAllowed) {
      return clampPlainSummary(fromModel, maxSummaryChars)
    }
    return fallbackSummary
  }, [lintsPending, homeSummaryResult?.summary, aiAllowed, fallbackSummary, maxSummaryChars])

  const handleTellMeMore = () => {
    if (!projectRef) return
    openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
    aiAssistant.newChat({
      name: `Health — ${projectName ?? projectRef}`,
      initialMessage: buildDetailedAssistantPrompt({
        projectRef,
        projectName,
        projectStatus,
        lints,
        metrics,
        connections,
        counts,
        migrationLabel,
        usesMockData,
      }),
    })
  }

  return (
    <div
      className={cn(
        'rounded-md p-[2px] min-h-[196px] flex flex-col',
        'bg-[length:300%_300%]',
        // Teal → brand green (#3ecf8e) → mint → cyan → emerald (still iridescent, on-brand)
        'bg-[linear-gradient(125deg,#0f766e_0%,#14b8a6_18%,#3ecf8e_36%,#5eead4_52%,#22d3ee_68%,#34d399_84%,#3ecf8e_100%)]',
        'animate-neon-rainbow-shift',
        'shadow-[0_0_10px_rgba(62,207,142,0.05),0_0_42px_rgba(20,184,166,0.06),0_0_64px_rgba(34,211,238,0.02)]',
        'motion-reduce:animate-none motion-reduce:shadow-none motion-reduce:bg-border motion-reduce:p-px',
        className
      )}
    >
      <div
        className={cn(
          'flex flex-1 flex-col gap-2 rounded-[5px] p-3',
          'bg-surface-100',
          'motion-reduce:rounded-md motion-reduce:border motion-reduce:border-border'
        )}
      >
        <div className="flex items-center justify-between gap-2 text-sm font-medium text-foreground-light">
          <div className="flex items-center gap-2">
            <AiIconAnimation size={14} className="h-3.5 w-3.5 text-brand shrink-0" aria-hidden />
            <span>Project Overview</span>
          </div>
          <div>
            <HoverCard>
              <HoverCardTrigger asChild>
                <Info size={14} className="text-foreground-lighter hover:text-foreground" />
              </HoverCardTrigger>
              <HoverCardContent
                side="bottom"
                align="center"
                className="w-[280px] p-3 text-sm overflow-hidden text-foreground-light"
              >
                <p>
                  This project overview is experimental and generated by AI based on the project's
                  data and based on the level of permissions given to the model. It may not be
                  accurate and should not be relied on for critical decisions.
                </p>
              </HoverCardContent>
            </HoverCard>
          </div>
        </div>
        <div className="text-sm text-foreground-light leading-relaxed line-clamp-[7] min-h-[6.5rem] flex-1">
          {showSummarySkeleton ? (
            <GenericSkeletonLoader className="w-full" />
          ) : (
            <p className="m-0">{displaySummary}</p>
          )}
        </div>
        <div className="mt-auto pt-1">
          <Button
            type="default"
            size="tiny"
            className="w-full"
            disabled={!projectRef || showSummarySkeleton}
            onClick={handleTellMeMore}
          >
            Tell me more
          </Button>
        </div>
      </div>
    </div>
  )
}
