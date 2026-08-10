import { ExternalLink, Replace, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn, HoverCard, HoverCardContent, HoverCardTrigger } from 'ui'

import {
  createTomlSourceLines,
  type TomlSourceLine,
  type TomlValueToken,
} from './ConfigurationTomlViewer.utils'
import type { GitHubConfigDriftField } from '@/lib/github-config-drift'
import type { GitHubConfigTarget } from '@/lib/github-config-effective'

export function ConfigurationTomlViewer({
  content,
  target,
  gitBranch,
  gitBranchUrl,
  driftedFields,
}: {
  content: string
  target: GitHubConfigTarget
  gitBranch?: string
  gitBranchUrl?: string
  driftedFields: readonly GitHubConfigDriftField[]
}) {
  const lines = createTomlSourceLines({ content, target, gitBranch, driftedFields })
  const layers = groupVisibleLines(lines)

  return (
    <div className="border-t border-border">
      <div
        aria-label="GitHub config.toml with configuration conflicts"
        className="divide-y divide-border"
      >
        {layers.map((layer) => {
          const isBase = layer.kind === 'base'
          const targetLabel = isBase
            ? 'Base'
            : `${target.charAt(0).toUpperCase()}${target.slice(1)}`

          return (
            <section key={layer.kind}>
              <dl className="grid gap-3 border-b border-border bg-surface-200/25 px-4 py-3 text-xs sm:grid-cols-2 sm:px-5">
                <div className="min-w-0">
                  <dt className="text-foreground-muted">Target</dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">{targetLabel}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-foreground-muted">
                    {isBase ? 'Applies to' : 'Requested Git branch'}
                  </dt>
                  <dd className="mt-1 truncate font-mono text-sm text-foreground">
                    {isBase ? (
                      'All environments'
                    ) : gitBranch && gitBranchUrl ? (
                      <a
                        href={gitBranchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${gitBranch} (opens in new tab)`}
                        className="inline-flex max-w-full items-center gap-1 hover:underline"
                      >
                        <span className="truncate">{gitBranch}</span>
                        <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                      </a>
                    ) : (
                      (gitBranch ?? 'Repository default')
                    )}
                  </dd>
                </div>
              </dl>
              <pre
                tabIndex={0}
                aria-label={`${targetLabel} configuration TOML`}
                className="m-0 max-h-[360px] overflow-auto bg-[#0d0d0d] px-4 py-4 font-mono text-xs leading-5 text-foreground sm:px-5"
              >
                <code>
                  {layer.lines.map((line) => (
                    <span key={line.lineNumber} className="block min-h-5 whitespace-pre">
                      {line.value ? (
                        <TomlLine line={line.text} value={line.value} />
                      ) : (
                        renderTomlLine(line.text)
                      )}
                    </span>
                  ))}
                </code>
              </pre>
            </section>
          )
        })}
      </div>
    </div>
  )
}

function groupVisibleLines(lines: readonly TomlSourceLine[]) {
  const base = lines.filter((line) => line.isVisible && line.layer === 'base')
  const target = lines.filter((line) => line.isVisible && line.layer !== 'base')

  return [
    { kind: 'base' as const, lines: trimBlankLines(base) },
    { kind: 'target' as const, lines: trimBlankLines(target) },
  ].filter((group) => group.lines.length > 0)
}

function trimBlankLines(lines: TomlSourceLine[]): TomlSourceLine[] {
  let start = 0
  let end = lines.length
  while (start < end && lines[start].text.trim() === '') start += 1
  while (end > start && lines[end - 1].text.trim() === '') end -= 1
  return lines.slice(start, end)
}

function TomlLine({ line, value }: { line: string; value: TomlValueToken }) {
  const hasPill = value.status === 'drifted' || value.status === 'overridden'

  return (
    <>
      {renderAssignmentPrefix(line.slice(0, value.start))}
      <HoverCard openDelay={150} closeDelay={100}>
        <HoverCardTrigger asChild>
          <button
            type="button"
            className={cn(
              'font-mono outline-none ring-offset-1 ring-offset-[#0d0d0d] transition-colors focus-visible:ring-1',
              hasPill &&
                'inline-flex h-[18px] max-w-full items-center gap-1 rounded-full border px-1.5',
              value.status === 'drifted' &&
                'border-warning-400/50 bg-warning-400/20 text-warning-300 hover:bg-warning-400/30',
              value.status === 'overridden' &&
                'border-border bg-surface-300/50 text-foreground-muted line-through decoration-foreground-muted hover:bg-surface-300',
              value.status === 'inactive' &&
                'text-foreground-muted opacity-60 hover:opacity-100 hover:underline',
              value.status === 'applied' && 'text-brand-300 hover:underline'
            )}
          >
            {hasPill && <ValueStatusIcon value={value} />}
            {renderTomlValue(line.slice(value.start, value.end))}
          </button>
        </HoverCardTrigger>
        <HoverCardContent side="top" align="start" className="w-80 overflow-hidden p-0 text-xs">
          <div className="p-3">
            <code className="text-code-inline">{value.configPath}</code>
            <p className="mt-1 leading-5 text-foreground-muted">{value.description}</p>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 border-t border-border bg-surface-100 p-3">
            <dt className="text-foreground-muted">Scope</dt>
            <dd className="text-foreground">{value.scopeLabel}</dd>
            <dt className="text-foreground-muted">Result</dt>
            <dd className="text-foreground">{getStatusDescription(value)}</dd>
            {value.dashboardValue !== undefined && (
              <>
                <dt className="text-foreground-muted">Current environment</dt>
                <dd className="break-all font-mono text-foreground">
                  {formatValue(value.dashboardValue)}
                </dd>
              </>
            )}
          </dl>
        </HoverCardContent>
      </HoverCard>
      {renderTomlSuffix(line.slice(value.end))}
    </>
  )
}

function ValueStatusIcon({ value }: { value: TomlValueToken }) {
  const Icon = value.status === 'drifted' ? TriangleAlert : Replace
  return (
    <Icon
      className={cn(
        'h-3 w-3 shrink-0 no-underline',
        value.status === 'drifted' ? 'text-warning-600' : 'text-foreground-muted'
      )}
      strokeWidth={1}
      aria-hidden="true"
    />
  )
}

function renderTomlLine(line: string): ReactNode {
  const table = line.match(/^(\s*)(\[)(.*)(\])(\s*(?:#.*)?)$/)
  if (table) {
    return (
      <>
        {table[1]}
        <span className="text-foreground-muted">{table[2]}</span>
        <span className="text-[#c586c0]">{table[3]}</span>
        <span className="text-foreground-muted">{table[4]}</span>
        {renderTomlSuffix(table[5])}
      </>
    )
  }

  const commentStart = line.indexOf('#')
  if (commentStart >= 0) {
    return (
      <>
        {line.slice(0, commentStart)}
        <span className="text-[#6a9955]">{line.slice(commentStart)}</span>
      </>
    )
  }

  return line
}

function renderAssignmentPrefix(prefix: string): ReactNode {
  const equals = prefix.lastIndexOf('=')
  if (equals < 0) return prefix

  const beforeEquals = prefix.slice(0, equals)
  const indentationLength = beforeEquals.length - beforeEquals.trimStart().length
  const indentation = beforeEquals.slice(0, indentationLength)
  const key = beforeEquals.slice(indentationLength).trimEnd()
  const spacing = beforeEquals.slice(indentationLength + key.length)

  return (
    <>
      {indentation}
      <span className="text-[#9cdcfe]">{key}</span>
      {spacing}
      <span className="text-foreground-muted">=</span>
      {prefix.slice(equals + 1)}
    </>
  )
}

function renderTomlValue(value: string): ReactNode[] {
  const parts: ReactNode[] = []
  const tokenPattern =
    /("(?:\\.|[^"\\])*"|'[^']*'|\b(?:true|false)\b|\b[-+]?\d+(?:\.\d+)?\b|[\[\]{},])/g
  let cursor = 0

  for (const match of value.matchAll(tokenPattern)) {
    const index = match.index ?? 0
    if (index > cursor) parts.push(value.slice(cursor, index))
    const token = match[0]
    const className =
      token.startsWith('"') || token.startsWith("'")
        ? 'text-[#ce9178]'
        : token === 'true' || token === 'false'
          ? 'text-[#569cd6]'
          : /^[-+]?\d/.test(token)
            ? 'text-[#b5cea8]'
            : 'text-foreground-muted'
    parts.push(
      <span key={`${index}-${token}`} className={className}>
        {token}
      </span>
    )
    cursor = index + token.length
  }

  if (cursor < value.length) parts.push(value.slice(cursor))
  return parts
}

function renderTomlSuffix(suffix: string): ReactNode {
  const commentStart = suffix.indexOf('#')
  if (commentStart < 0) return suffix

  return (
    <>
      {suffix.slice(0, commentStart)}
      <span className="text-[#6a9955]">{suffix.slice(commentStart)}</span>
    </>
  )
}

function getStatusDescription(value: TomlValueToken): string {
  if (value.status === 'drifted') return 'Conflicts with the current environment'
  if (value.status === 'overridden') {
    return `Overridden by the ${value.overriddenByScope ?? 'later configuration layer'}`
  }
  if (value.status === 'inactive') return 'Not applied to the selected environment'
  if (value.overridesScopes.length > 0) {
    return `Applied; overrides ${value.overridesScopes.join(', ')}`
  }
  return 'Applied to the selected environment'
}

function formatValue(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value)
}
