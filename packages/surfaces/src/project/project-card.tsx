import { CircleXIcon, ExternalLinkIcon, Loader2Icon, RefreshCwIcon } from 'lucide-react'
import { Fragment, useId, type ReactNode } from 'react'
import { Badge, Button, Card, cn, Skeleton } from 'ui'

import { ProjectDetails } from './project-identity'

export interface ProjectCardBadge {
  label: string
  tone?: 'success' | 'warning' | 'danger'
  /** Shows a spinner while the host follows a status that is changing. */
  isSpinning?: boolean
  /** Extra detail on hover, e.g. why a check failed. */
  title?: string
}

/** A line under the details: a problem, or why the status won't update. */
export interface ProjectCardNote {
  tone: 'danger' | 'muted'
  text: string
}

export interface ProjectCardProps {
  /** Nothing is known yet beyond what is passed. Missing parts show as skeletons, in place. */
  isLoading?: boolean
  /**
   * Names of what it belongs to, outermost first, shown above the name once
   * known: the organization, then for a branch its project. Slugs are not
   * shown: they rarely read as names.
   */
  breadcrumbs?: string[]
  name?: string
  badge?: ProjectCardBadge
  note?: ProjectCardNote
  /** Labels are for screen readers; the values are shown, or skeletons while loading. */
  details: { label: string; value?: string }[]
  /**
   * Checks the status again, from a small icon beside the badge. Pass it only
   * when checking has stopped without an answer.
   */
  onRetry?: () => void
  isRetrying?: boolean
  /** Opens the project in the Supabase dashboard. Omit to hide the action. */
  onOpenDashboard?: () => void
  /** For hosts that draw the card on their own surface, e.g. `bg-transparent shadow-none`. */
  className?: string
  /** Rendered edge to edge along the bottom of the card, e.g. `ConnectionDetails`. */
  children?: ReactNode
}

const BADGE_VARIANTS = {
  neutral: 'default',
  success: 'success',
  warning: 'warning',
  danger: 'destructive',
} as const

/**
 * A 44pt tap target on touch screens, without changing the size drawn. Hints
 * are native `title`s, never popovers: a host clips a popover at the edge of
 * the frame an inline card sits in.
 */
const TOUCH_TARGET = 'relative pointer-coarse:after:absolute pointer-coarse:after:content-[""]'

function StatusBadge({ badge }: { badge: ProjectCardBadge }) {
  return (
    <Badge variant={BADGE_VARIANTS[badge.tone ?? 'neutral']} title={badge.title}>
      {badge.isSpinning && (
        <Loader2Icon
          size={10}
          aria-hidden="true"
          className="animate-spin motion-reduce:[animation-duration:3s]"
        />
      )}
      {badge.label}
    </Badge>
  )
}

/**
 * One project (or branch, which is a project too) and its current status,
 * condensed from Home's header for a conversation: breadcrumbs, name and
 * status badge, then a dot-separated row of details (ref, region), with Open
 * in dashboard beside them. A note and `children` render below, e.g. a
 * problem or connection details.
 *
 * While `isLoading`, the layout stays the same and anything not known yet
 * (breadcrumbs, name, badge, a detail's value, the action) is a skeleton the
 * size of what it stands in for, so nothing moves when the data arrives.
 *
 * The card only shows what it is given. A host follows the status and says
 * how to show it; `creationStatus` does that for something being created.
 */
export function ProjectCard({
  isLoading = false,
  breadcrumbs = [],
  name,
  badge,
  note,
  details,
  onRetry,
  isRetrying = false,
  onOpenDashboard,
  className,
  children,
}: ProjectCardProps) {
  const nameId = useId()

  return (
    <Card className={className}>
      <section
        aria-labelledby={name === undefined ? undefined : nameId}
        aria-label={name === undefined ? 'Loading' : undefined}
        aria-busy={isLoading || isRetrying}
      >
        <div className="flex flex-col gap-3 p-4">
          {/* Identity, then the action; it wraps below when the card is narrow. */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex min-w-0 flex-[1_1_16rem] flex-col gap-0.5">
              {breadcrumbs.length > 0 ? (
                <p className="truncate text-sm text-foreground-light">
                  {breadcrumbs.map((crumb, index) => (
                    <Fragment key={index}>
                      {index > 0 && (
                        <span aria-hidden="true" className="mx-1 text-foreground-muted">
                          /
                        </span>
                      )}
                      {crumb}
                    </Fragment>
                  ))}
                </p>
              ) : (
                isLoading && (
                  <div aria-hidden="true" className="flex h-lh items-center text-sm">
                    <Skeleton className="h-3.5 w-20" />
                  </div>
                )
              )}
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                {name === undefined ? (
                  <div aria-hidden="true" className="flex h-lh items-center text-base">
                    <Skeleton className="h-4 w-40" />
                  </div>
                ) : (
                  <h2 id={nameId} className="truncate text-base font-medium text-foreground">
                    {name}
                  </h2>
                )}
                {badge ? (
                  <StatusBadge badge={badge} />
                ) : (
                  <Skeleton aria-hidden="true" className="h-[17px] w-16 rounded-full" />
                )}
                {onRetry && (
                  <Button
                    variant="text"
                    size="tiny"
                    aria-label="Retry"
                    title="Check the status again"
                    className={cn(
                      TOUCH_TARGET,
                      'size-5 rounded-full px-0 text-foreground-light hover:text-foreground pointer-coarse:after:-inset-3'
                    )}
                    loading={isRetrying}
                    icon={<RefreshCwIcon size={12} aria-hidden="true" />}
                    onClick={onRetry}
                  />
                )}
              </div>
              <ProjectDetails details={details} className="text-sm" />
            </div>
            {(isLoading || onOpenDashboard) && (
              <div className="flex flex-none">
                {isLoading ? (
                  <Skeleton aria-hidden="true" className="size-[26px]" />
                ) : (
                  <Button
                    variant="default"
                    size="tiny"
                    aria-label="Open in dashboard"
                    title="Open in dashboard"
                    className={cn(TOUCH_TARGET, 'pointer-coarse:after:-inset-[9px]')}
                    icon={<ExternalLinkIcon size={14} aria-hidden="true" />}
                    onClick={onOpenDashboard}
                  />
                )}
              </div>
            )}
          </div>
          {note && (
            <div
              className={cn(
                'flex items-center gap-2 text-sm',
                note.tone === 'danger' ? 'text-destructive' : 'text-foreground-lighter'
              )}
            >
              {note.tone === 'danger' && (
                <CircleXIcon size={16} aria-hidden="true" className="flex-none" />
              )}
              {/* Wraps inside the card even when the message has a long unbroken word. */}
              <p className="min-w-0 flex-1 [overflow-wrap:anywhere]">{note.text}</p>
            </div>
          )}
        </div>
        {children}
      </section>
    </Card>
  )
}
