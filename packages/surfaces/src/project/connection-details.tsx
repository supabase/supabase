import {
  CheckIcon,
  ChevronDownIcon,
  CircleXIcon,
  CopyIcon,
  ExternalLinkIcon,
  Loader2Icon,
} from 'lucide-react'
import { useEffect, useId, useRef, useState, type MouseEvent } from 'react'
import {
  cn,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from 'ui'

import { useAnnounce } from '../common/announcer'
import type { ApiKey } from '../contract'

/**
 * A ready project's connection details, as a host has them. A host loads them
 * the first time the section opens. If they can't be read (the connection
 * lacks the tools, is scoped to another project, has no enabled key, or the
 * read failed), `dashboard` points to the dashboard's Connect dialog instead.
 * `details` and `dashboard` are final.
 */
export type ConnectionState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'details'; url: string; key: string }
  | { status: 'dashboard' }

/** Prefer an enabled publishable key, then the legacy `anon` key. */
export function pickPublishableKey(keys: ApiKey[]): string | undefined {
  const enabled = keys.filter((key) => !key.disabled)
  return (
    enabled.find((key) => key.type === 'publishable') ??
    enabled.find((key) => key.type === 'legacy' && key.name === 'anon') ??
    enabled.find((key) => key.type === 'legacy')
  )?.api_key
}

const FEEDBACK_MS = 1500

/**
 * A label, a read-only value and a copy button. The button's name stays "Copy
 * {label}"; the result is announced instead, since screen readers don't
 * reliably announce a name change on a focused button.
 */
export function CopyField({ label, value }: { label: string; value: string }) {
  const id = useId()
  const announce = useAnnounce()
  const [state, setState] = useState<'copied' | 'failed'>()
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  function flash(next: 'copied' | 'failed') {
    clearTimeout(timer.current)
    setState(next)
    timer.current = setTimeout(() => setState(undefined), FEEDBACK_MS)
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      flash('copied')
      announce(`Copied ${label}`)
    } catch {
      // Hosts without the clipboard permission reject, and may have nowhere to
      // show a toast: the button says so, and the value stays selectable.
      flash('failed')
      announce(`Couldn't copy ${label}`, 'assertive')
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-foreground-lighter">
        {label}
      </label>
      <InputGroup>
        <InputGroupInput
          id={id}
          readOnly
          size="small"
          value={value}
          className="font-mono text-xs"
          onFocus={(event) => event.target.select()}
        />
        <InputGroupAddon align="inline-end" className="pr-1 has-[>button]:mr-0">
          <InputGroupButton
            size="tiny"
            variant="default"
            aria-label={`Copy ${label}`}
            title={`Copy ${label}`}
            className={cn(
              // A 44pt tap target on touch screens, without changing the size drawn.
              'relative pointer-coarse:after:absolute pointer-coarse:after:-inset-2.5 pointer-coarse:after:content-[""]',
              state === 'copied' && 'text-brand-600',
              state === 'failed' && 'text-destructive'
            )}
            icon={
              state === 'copied' ? (
                <CheckIcon size={14} aria-hidden="true" className="text-current" />
              ) : state === 'failed' ? (
                <CircleXIcon size={14} aria-hidden="true" className="text-current" />
              ) : (
                <CopyIcon size={14} aria-hidden="true" />
              )
            }
            onClick={() => void copy()}
          />
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}

export interface ConnectionDetailsProps {
  connection: ConnectionState
  /** The section was opened. Hosts load the details the first time. */
  onOpen: () => void
  /** The project's page in the Supabase dashboard. */
  projectUrl: string
  /** The dashboard page that shows the project's connection details. */
  connectUrl: string
  /**
   * Opens a link. Sandboxed hosts can't navigate, so they pass this. Omit it
   * when the host can't open links: they are then offered to copy instead.
   */
  onOpenLink?: (url: string) => void
}

/**
 * A ready project's connection details, collapsed along the bottom of a
 * `ProjectCard`: the project URL and a publishable key to copy, or a link to
 * where the dashboard shows them. Nothing here is sent to the agent.
 */
export function ConnectionDetails({
  connection,
  onOpen,
  projectUrl,
  connectUrl,
  onOpenLink,
}: ConnectionDetailsProps) {
  // `href` keeps it a real link for assistive tech, copying and middle-click.
  function openLink(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault()
    onOpenLink?.(event.currentTarget.href)
  }

  return (
    // An inset area along the card's bottom edge, divided off by the card's own hairline.
    <Collapsible className="border-t bg-muted" onOpenChange={(isOpen) => isOpen && onOpen()}>
      <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 px-4 py-2 text-sm font-medium text-foreground-lighter hover:text-foreground-light pointer-coarse:py-3">
        Connection details
        <ChevronDownIcon
          size={16}
          aria-hidden="true"
          className="flex-none transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none"
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex flex-col gap-3 px-4 pb-4">
          {connection.status === 'loading' && (
            <p className="flex items-center gap-2 py-2 text-sm text-foreground-lighter">
              <Loader2Icon
                size={14}
                aria-hidden="true"
                className="animate-spin motion-reduce:[animation-duration:3s]"
              />
              Loading connection details…
            </p>
          )}
          {connection.status === 'dashboard' &&
            (onOpenLink ? (
              <a
                href={connectUrl}
                onClick={openLink}
                className="inline-flex items-center gap-1 self-start text-sm text-foreground-light underline underline-offset-4 hover:text-foreground"
              >
                Open in Studio
                <ExternalLinkIcon size={14} aria-hidden="true" />
              </a>
            ) : (
              <CopyField label="Studio link" value={connectUrl} />
            ))}
          {connection.status === 'details' && (
            <>
              <CopyField label="Project URL" value={connection.url} />
              <CopyField label="Publishable key" value={connection.key} />
              {!onOpenLink && <CopyField label="Studio link" value={projectUrl} />}
            </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
