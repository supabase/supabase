import { BracesIcon, ExternalLinkIcon } from 'lucide-react'
import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { surfaceResources } from 'surfaces/contract'
import { Card, Popover, PopoverContent, PopoverTrigger } from 'ui'

import {
  CATALOG,
  PRESENTATIONS,
  resourceMeta,
  SUPPORTING_TOOLS,
  type CatalogEntry,
  type CatalogFrame,
  type SupportingTool,
  type ToolKind,
} from './catalog'

import '../styles.css'

const TOOL_KINDS: Record<ToolKind, string> = {
  entrypoint: 'Entrypoint',
  launch: 'Launch tool',
  'tool-result': 'Tool-result view',
}

/**
 * Embeds a surface like a host would. Inline frames follow their content height,
 * as hosts do with the MCP Apps size-changed notification; the preview is
 * same-origin, so the gallery can observe the document directly. Inline
 * resources set prefersBorder: false, so hosts draw no frame around them.
 */
function PreviewFrame({ frame, isInline }: { frame: CatalogFrame; isInline: boolean }) {
  const ref = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(frame.height)

  useEffect(() => {
    const element = ref.current
    if (!isInline || !element) return
    let observer: ResizeObserver | undefined
    const observe = () => {
      const body = element.contentDocument?.body
      if (!body) return
      observer?.disconnect()
      observer = new ResizeObserver(() => setHeight(body.scrollHeight))
      observer.observe(body)
    }
    element.addEventListener('load', observe)
    observe()
    return () => {
      element.removeEventListener('load', observe)
      observer?.disconnect()
    }
  }, [isInline])

  return (
    <iframe
      ref={ref}
      title={frame.title}
      src={frame.src}
      // Each dev frame loads hundreds of unbundled modules; loading all at once exhausts the browser.
      loading="lazy"
      className={isInline ? 'w-full' : 'w-full rounded-lg border'}
      style={{ height }}
    />
  )
}

function JsonPopover({ label, value }: { label: string; value: unknown }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`View ${label}`}
          className="inline-flex items-center gap-1.5 text-foreground-light hover:text-foreground"
        >
          <BracesIcon size={14} aria-hidden="true" />
          View
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto max-w-[min(36rem,90vw)] p-0">
        <pre className="max-h-96 overflow-auto p-4 text-xs text-foreground-light">
          {JSON.stringify(value, null, 2)}
        </pre>
      </PopoverContent>
    </Popover>
  )
}

function OpenLink({ href, children = 'Open in new tab' }: { href: string; children?: ReactNode }) {
  return (
    <a
      className="inline-flex items-center gap-1.5 text-foreground-light hover:text-foreground"
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      <ExternalLinkIcon size={14} aria-hidden="true" />
      {children}
    </a>
  )
}

interface Property {
  label: string
  value: ReactNode
}

/** Labels on the left, values on the right. Long values such as tool names and URIs wrap. */
function Properties({ properties }: { properties: Property[] }) {
  return (
    <dl className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
      {properties.map(({ label, value }) => (
        <Fragment key={label}>
          <dt className="text-foreground-lighter">{label}</dt>
          <dd className="min-w-0 text-foreground [overflow-wrap:anywhere]">{value}</dd>
        </Fragment>
      ))}
    </dl>
  )
}

function Title({
  title,
  description,
  isLarge = false,
}: {
  title: string
  description: string
  /** Components get a larger name than the cards of supporting tools. */
  isLarge?: boolean
}) {
  return (
    <header className="flex flex-col gap-1">
      <h3 className={`font-medium text-foreground ${isLarge ? 'text-base' : 'text-sm'}`}>
        {title}
      </h3>
      <p className="text-sm text-foreground-light">{description}</p>
    </header>
  )
}

const unique = <T,>(values: T[]) => [...new Set(values)]

/** One value per line when a component has several. */
function Values({ values }: { values: string[] }) {
  return (
    <span className="flex flex-col gap-1">
      {values.map((value) => (
        <span key={value}>{value}</span>
      ))}
    </span>
  )
}

/** A single value as is; several keyed by what they belong to. */
function keyed<T>(entries: [string, T][]) {
  return entries.length === 1 ? entries[0][1] : Object.fromEntries(entries)
}

function Entry({ entry }: { entry: CatalogEntry }) {
  const hasOneFrame = entry.frames.length === 1
  const surfaces = unique(entry.uses.map((use) => use.surface))
  return (
    <section
      id={entry.id}
      className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[20rem_minmax(0,1fr)]"
    >
      {/* Stays beside a tall preview while it scrolls past. */}
      <div className="flex flex-col gap-5 lg:sticky lg:top-8 lg:self-start">
        <Title title={entry.title} description={entry.description} isLarge />
        <Properties
          properties={[
            {
              label: 'Surface',
              value: (
                <Values values={unique(entry.uses.map((use) => PRESENTATIONS[use.presentation]))} />
              ),
            },
            { label: 'Tool', value: <Values values={entry.uses.map((use) => use.tool)} /> },
            {
              label: 'Kind',
              value: <Values values={unique(entry.uses.map((use) => TOOL_KINDS[use.toolKind]))} />,
            },
            {
              label: 'Resource',
              value: <Values values={surfaces.map((surface) => surfaceResources[surface].uri)} />,
            },
            {
              label: 'Tool meta',
              value: (
                <JsonPopover
                  label="tool meta"
                  value={keyed(entry.uses.map((use) => [use.tool, use.toolMeta]))}
                />
              ),
            },
            {
              label: 'Resource meta',
              value: (
                <JsonPopover
                  label="resource meta"
                  value={keyed(
                    surfaces.map((surface) => [
                      surfaceResources[surface].uri,
                      resourceMeta(surface),
                    ])
                  )}
                />
              ),
            },
            ...(hasOneFrame
              ? [{ label: 'Preview', value: <OpenLink href={entry.frames[0].src} /> }]
              : []),
          ]}
        />
      </div>
      <div className="flex min-w-0 flex-col gap-8">
        {entry.frames.map((frame) => (
          <div key={frame.src} className="flex flex-col gap-2 text-sm">
            {!hasOneFrame && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-foreground-light">{frame.title}</span>
                <OpenLink href={frame.src} />
              </div>
            )}
            <PreviewFrame frame={frame} isInline={!!frame.isInline} />
          </div>
        ))}
      </div>
    </section>
  )
}

function SupportingEntry({ tool }: { tool: SupportingTool }) {
  return (
    <Card className="flex h-full flex-col gap-4 p-5">
      <Title title={tool.title} description={tool.description} />
      <Properties
        properties={[
          { label: 'Kind', value: tool.kind },
          ...(tool.meta
            ? [{ label: 'Tool meta', value: <JsonPopover label="tool meta" value={tool.meta} /> }]
            : []),
        ]}
      />
    </Card>
  )
}

/**
 * The reference for every component an agent host can show, on sample data,
 * with where it shows, the tool that opens it and the `_meta` a server sends.
 */
function Gallery() {
  return (
    // The header sits as far below the top as the first component sits below the header.
    <main className="flex flex-col gap-16 px-6 py-16 sm:px-10 lg:px-16 xl:px-24">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium text-foreground">Supabase surfaces</h1>
        <p className="text-base text-foreground-light">
          Every component agent hosts can show, on sample data.
        </p>
      </header>
      <div className="flex flex-col gap-24">
        {CATALOG.map((entry) => (
          <Entry key={entry.id} entry={entry} />
        ))}
        <div id="supporting" className="flex flex-col gap-10">
          <header className="flex max-w-2xl flex-col gap-2">
            <h2 className="text-lg font-medium text-foreground">Supporting tools</h2>
            <p className="text-sm text-foreground-light">
              Tools without a view of their own that the components rely on.
            </p>
          </header>
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {SUPPORTING_TOOLS.map((tool) => (
              <li key={tool.title}>
                <SupportingEntry tool={tool} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(<Gallery />)
