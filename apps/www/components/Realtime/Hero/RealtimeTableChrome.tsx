import { ChevronDown, MoreVertical, Plus, RefreshCw, Search, Table2 } from 'lucide-react'
import { Button, cn } from 'ui'

function LivePresenceBadge({ count }: { count: number }) {
  return (
    <div
      className="ml-auto flex items-center gap-2 pr-2 text-xs font-medium tabular-nums text-brand"
      aria-label={`${count} people viewing this demo`}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
      </span>
      <span>
        {count} {count === 1 ? 'person' : 'people'}
      </span>
    </div>
  )
}

type RealtimeTableChromeProps = {
  presenceCount: number
}

export function RealtimeTableChrome({ presenceCount }: RealtimeTableChromeProps) {
  return (
    <div className="flex flex-col bg-dash-sidebar dark:bg-surface-100">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-2 pt-2 border-b border-default bg-dash-sidebar dark:bg-surface-100">
        <div className="flex items-center gap-1">
          <div className="relative flex items-center gap-2 px-3 h-9 text-xs bg-surface-100 border border-default border-b-0 rounded-t-sm">
            <Table2 size={14} className="text-foreground-light" />
            <span className="text-foreground">User</span>
            <div className="absolute top-0 left-0 right-0 h-px bg-foreground-muted" />
          </div>
          <button
            type="button"
            disabled
            aria-label="Add tab"
            className="flex h-7 w-7 items-center justify-center rounded-sm text-foreground-lighter opacity-50 cursor-not-allowed"
          >
            <Plus size={14} />
          </button>
        </div>
        <LivePresenceBadge count={presenceCount} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-nowrap items-center gap-2 px-2 py-1.5 border-b border-default overflow-x-auto">
        <div
          aria-hidden
          className="flex min-w-[200px] flex-1 items-center gap-2 h-8 px-2 rounded-md border border-default bg-surface-75 opacity-60 cursor-not-allowed"
        >
          <Search size={14} className="text-foreground-lighter shrink-0" />
          <span className="text-sm text-foreground-lighter truncate select-none">
            Filter by id, name, email... or ask AI
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Button disabled type="default" size="tiny" className="h-[26px] px-2.5">
            <span className="flex items-center gap-1 whitespace-nowrap">
              Sort
              <ChevronDown size={12} strokeWidth={1} className="text-foreground-lighter" />
            </span>
          </Button>

          <Button disabled type="default" size="tiny" className="h-[26px] px-2.5">
            <span className="flex items-center gap-1 whitespace-nowrap">
              <span className="text-foreground-muted">Role</span>
              <span>postgres</span>
              <ChevronDown size={12} strokeWidth={1} className="text-foreground-lighter" />
            </span>
          </Button>

          <button
            type="button"
            disabled
            aria-label="More actions"
            className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-md text-foreground-lighter opacity-50 cursor-not-allowed"
          >
            <MoreVertical size={14} />
          </button>

          <button
            type="button"
            disabled
            aria-label="Refresh"
            className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-md text-foreground-lighter opacity-50 cursor-not-allowed"
          >
            <RefreshCw size={14} />
          </button>

          <Button disabled type="primary" size="tiny" className="h-[26px] pl-2.5 pr-1.5">
            <span className="flex items-center gap-0.5 whitespace-nowrap">
              Insert
              <ChevronDown size={14} strokeWidth={1.5} />
            </span>
          </Button>
        </div>
      </div>
    </div>
  )
}

export function RealtimeTableFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'border-default border rounded-md overflow-hidden shadow-md bg-dash-sidebar',
        className
      )}
    >
      {children}
    </div>
  )
}
