import { cn, Skeleton } from 'ui'

import type { ElicitationRequest } from './McpElicitation.types'

const DETAIL_ROW_COUNT = 3

const DetailRow = ({
  label,
  value,
  isMono = false,
}: {
  label: string
  value: string
  isMono?: boolean
}) => (
  <div className="flex items-center justify-between gap-4 py-2.5 text-xs">
    <span className="shrink-0 text-foreground-light">{label}</span>
    <span className={cn('min-w-0 truncate text-right text-foreground', isMono && 'font-mono')}>
      {value}
    </span>
  </div>
)

/**
 * The link is forgeable in v1, so these rows are load-bearing: the project and
 * the signed-in account are how the user checks the request is the one they
 * asked for. The calling client isn't named because the URL doesn't carry it.
 */
export const McpElicitationDetails = ({ request }: { request: ElicitationRequest }) => (
  <div className="divide-y rounded-md border bg-surface-75 px-4">
    <DetailRow label="Tool" value={request.tool} isMono />
    <DetailRow label="Project" value={request.project} />
    <DetailRow label="Signed in as" value={request.account} />
  </div>
)

/** Same row count and paddings as {@link McpElicitationDetails} so nothing shifts on resolve. */
export const McpElicitationDetailsSkeleton = () => (
  <div className="divide-y rounded-md border bg-surface-75 px-4">
    {Array.from({ length: DETAIL_ROW_COUNT }).map((_, index) => (
      <div key={index} className="flex items-center justify-between gap-4 py-2.5 text-xs">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-24" />
      </div>
    ))}
  </div>
)
