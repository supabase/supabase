'use client'

import { ChevronRight, CircleAlert, Copy, CornerDownRight, ExternalLink } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  cn,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  copyToClipboard,
  ScrollArea,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

import { STATUS_BADGE_VARIANT } from './Header'
import { useData, useView } from './Trace'
import type { Span, ValueKind } from './types'
import {
  detectValueKind,
  durationOf,
  formatMs,
  inferMarkerKind,
  sortedEntries,
  stringifyValue,
  summarizeJson,
} from './utils'

function copy(text: string) {
  copyToClipboard(text, () => toast.success('Copied to clipboard'))
}

interface ValueProps {
  entryKey: string
  value: unknown
  kind: ValueKind
}

function Value({ entryKey, value, kind }: ValueProps) {
  const { byId } = useData()
  const { dispatch } = useView()

  switch (kind) {
    case 'null':
      return <span className="text-foreground-muted">null</span>
    case 'boolean':
      return (
        <span className={cn(value ? 'text-brand' : 'text-foreground-light')}>{String(value)}</span>
      )
    case 'number':
      return <span className="tabular-nums">{stringifyValue(value)}</span>
    case 'id': {
      const id = String(value)
      if (!byId.has(id) || /trace/i.test(entryKey)) return <span className="break-all">{id}</span>
      return (
        <Button
          variant="link"
          size="tiny"
          className="h-auto p-0 font-mono text-xs"
          iconRight={<CornerDownRight />}
          onClick={() => dispatch({ type: 'select', id })}
        >
          {id}
        </Button>
      )
    }
    case 'url': {
      const href = String(value)
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex max-w-full items-center gap-1 break-all text-brand underline-offset-2 hover:underline focus-ring"
        >
          <span className="min-w-0 break-all">{href}</span>
          <ExternalLink className="size-3 shrink-0" />
        </a>
      )
    }
    case 'error':
      return (
        <pre className="whitespace-pre-wrap break-words font-mono text-destructive">
          {String(value)}
        </pre>
      )
    case 'json':
      return (
        <Collapsible className="group/json">
          <CollapsibleTrigger asChild>
            <Button
              variant="text"
              size="tiny"
              className="h-auto px-1 py-0.5 font-mono text-xs"
              iconLeft={
                <ChevronRight className="transition-transform group-data-[state=open]/json:rotate-90 motion-reduce:transition-none" />
              }
            >
              {summarizeJson(value)}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <pre className="mt-1 max-h-64 overflow-auto rounded bg-surface-200 p-2 text-xs">
              {stringifyValue(value)}
            </pre>
          </CollapsibleContent>
        </Collapsible>
      )
    default:
      return <span className="whitespace-pre-wrap break-all">{String(value)}</span>
  }
}

interface KeyValueProps {
  data: Record<string, unknown>
  emptyMessage?: ReactNode
  className?: string
}

function KeyValue({ data, emptyMessage = 'No attributes', className }: KeyValueProps) {
  const entries = sortedEntries(data)

  if (entries.length === 0) {
    return (
      <div
        data-trace-key-value
        data-empty
        className={cn('px-3 py-2 text-xs text-foreground-light', className)}
      >
        {emptyMessage}
      </div>
    )
  }

  return (
    <div data-trace-key-value className={cn('text-xs', className)}>
      <Table containerProps={{ className: 'overflow-visible' }}>
        <TableBody>
          {entries.map(([key, value]) => {
            const kind = detectValueKind(key, value)
            return (
              <TableRow key={key} data-trace-key-value-row data-kind={kind} className="group/kv">
                <TableCell className="w-[38%] min-w-0 py-1.5 pl-3 pr-2 align-top">
                  <span className="block break-all font-mono text-foreground-light">{key}</span>
                </TableCell>
                <TableCell className="min-w-0 py-1.5 pl-2 pr-2 align-top font-mono">
                  <div className="flex items-start gap-1">
                    <div className="min-w-0 flex-1">
                      <Value entryKey={key} value={value} kind={kind} />
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="text"
                          size="tiny"
                          aria-label={`Copy ${key}`}
                          className="size-5 shrink-0 p-0 opacity-0 group-hover/kv:opacity-100 focus-visible:opacity-100"
                          icon={<Copy />}
                          onClick={() => copy(stringifyValue(value))}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="left">Copy value</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

interface SectionProps {
  title: ReactNode
  count?: number
  children: ReactNode
}

function Section({ title, count, children }: SectionProps) {
  return (
    <section data-trace-inspector-section className="border-b border-muted last:border-b-0">
      <h3 className="flex items-center gap-2 px-3 pb-1 pt-3 text-xs font-medium text-foreground-light">
        {title}
        {count !== undefined && (
          <span className="font-mono tabular-nums text-foreground-lighter">{count}</span>
        )}
      </h3>
      <div className="pb-2">{children}</div>
    </section>
  )
}

function SpanHeader({ span }: { span: Span }) {
  const { nowMs, bounds } = useData()
  const isRunning = span.endMs === null
  const duration = formatMs(durationOf(span, nowMs))

  return (
    <header
      data-trace-inspector-header
      className="flex flex-col gap-2 border-b border-default px-3 py-3"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge data-service={span.serviceName} className="normal-case tracking-normal">
          {span.serviceName}
        </Badge>
        <Badge variant={STATUS_BADGE_VARIANT[span.status]} data-status={span.status}>
          {span.status}
        </Badge>
        <Badge>{span.kind}</Badge>
        {isRunning && <Badge>running</Badge>}
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <h2 className="truncate text-sm font-medium text-foreground">{span.name}</h2>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="start">
          {span.name}
        </TooltipContent>
      </Tooltip>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-xs">
        <dt className="text-foreground-light">Duration</dt>
        <dd className="tabular-nums text-foreground">{isRunning ? `${duration}…` : duration}</dd>
        <dt className="text-foreground-light">Started</dt>
        <dd className="tabular-nums text-foreground">+{formatMs(span.startMs - bounds[0])}</dd>
        <dt className="text-foreground-light">Span ID</dt>
        <dd className="flex min-w-0 items-center gap-1 text-foreground">
          <span className="truncate">{span.id}</span>
          <Button
            variant="text"
            size="tiny"
            aria-label="Copy span ID"
            className="size-5 shrink-0 p-0"
            icon={<Copy />}
            onClick={() => copy(span.id)}
          />
        </dd>
      </dl>
    </header>
  )
}

function Events({ span }: { span: Span }) {
  return (
    <Section title="Events" count={span.events.length}>
      {span.events.length === 0 && (
        <p className="px-3 py-2 text-xs text-foreground-light">No events</p>
      )}
      {span.events.length > 0 && (
        <ol className="flex flex-col">
          {span.events.map((event, index) => {
            const kind = inferMarkerKind(event)
            const hasAttributes = event.attributes && Object.keys(event.attributes).length > 0
            return (
              <li
                key={`${event.timeMs}-${event.name}-${index}`}
                data-trace-inspector-event
                data-kind={kind}
                className="flex flex-col gap-1 border-t border-muted px-3 py-2 first:border-t-0"
              >
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-16 shrink-0 font-mono tabular-nums text-foreground-lighter">
                    +{formatMs(event.timeMs - span.startMs)}
                  </span>
                  {kind === 'exception' && (
                    <CircleAlert className="size-3 shrink-0 text-destructive" />
                  )}
                  <span
                    className={cn(
                      'truncate font-mono',
                      kind === 'exception' ? 'text-destructive' : 'text-foreground'
                    )}
                  >
                    {event.name}
                  </span>
                </div>
                {hasAttributes && <KeyValue data={event.attributes ?? {}} className="-mx-3" />}
              </li>
            )
          })}
        </ol>
      )}
    </Section>
  )
}

function Links({ span }: { span: Span }) {
  const { byId } = useData()
  const { dispatch } = useView()
  if (span.links.length === 0) return null

  return (
    <Section title="Links" count={span.links.length}>
      <ul className="flex flex-col">
        {span.links.map((link) => (
          <li
            key={`${link.traceId}:${link.spanId}`}
            data-trace-inspector-link
            className="flex items-center gap-2 px-3 py-1 font-mono text-xs"
          >
            <span className="text-foreground-light">trace</span>
            <span className="truncate">{link.traceId}</span>
            <span className="text-foreground-light">span</span>
            {byId.has(link.spanId) ? (
              <Button
                variant="link"
                size="tiny"
                className="h-auto min-w-0 p-0 font-mono text-xs"
                iconRight={<CornerDownRight />}
                onClick={() => dispatch({ type: 'select', id: link.spanId })}
              >
                <span className="truncate">{link.spanId}</span>
              </Button>
            ) : (
              <span className="truncate">{link.spanId}</span>
            )}
          </li>
        ))}
      </ul>
    </Section>
  )
}

export interface InspectorProps extends ComponentProps<'aside'> {
  spanId?: string
  emptyMessage?: ReactNode
}

export function Inspector({ spanId, emptyMessage, className, ...props }: InspectorProps) {
  const data = useData()
  const { selectedId } = useView()
  const resolvedId = spanId ?? selectedId
  const span = resolvedId !== null ? (data.byId.get(resolvedId) ?? null) : null

  return (
    <aside
      role="complementary"
      aria-label="Span details"
      data-trace-inspector
      data-empty={span ? undefined : ''}
      className={cn(
        'flex min-h-0 flex-col overflow-hidden border-l border-default bg-surface-100 text-sm',
        className
      )}
      {...props}
    >
      {!span && (
        <div
          data-trace-inspector-empty
          className="flex flex-1 items-center justify-center p-6 text-center text-sm text-foreground-light"
        >
          {emptyMessage ?? 'Select a span to see its details'}
        </div>
      )}
      {span && (
        <>
          <SpanHeader span={span} />
          <ScrollArea className="min-h-0 flex-1">
            <Section title="Attributes" count={Object.keys(span.attributes).length}>
              <KeyValue data={span.attributes} />
            </Section>
            <Events span={span} />
            <Links span={span} />
          </ScrollArea>
        </>
      )}
    </aside>
  )
}
