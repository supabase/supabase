'use client'

import { HoverCard, HoverCardContent, HoverCardTrigger } from 'ui'
import { useCopyToClipboard } from 'components/interfaces/DataTableDemo/hooks/use-copy-to-clipboard'
import { cn } from 'ui'
import { UTCDate } from '@date-fns/utc'
import { HoverCardPortal } from '@radix-ui/react-hover-card'
import { format, formatDistanceToNowStrict } from 'date-fns'
import { Check, Copy } from 'lucide-react'
import type { ComponentPropsWithoutRef } from 'react'

type HoverCardContentProps = ComponentPropsWithoutRef<typeof HoverCardContent>

interface DataTableColumnTimestampProps {
  date: Date
  side?: HoverCardContentProps['side']
  sideOffset?: HoverCardContentProps['sideOffset']
  align?: HoverCardContentProps['align']
  alignOffset?: HoverCardContentProps['alignOffset']
  className?: string
}

export function DataTableColumnTimestamp({
  date,
  side = 'right',
  align = 'start',
  alignOffset = -4,
  sideOffset,
  className,
}: DataTableColumnTimestampProps) {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  return (
    <HoverCard openDelay={0} closeDelay={0}>
      <HoverCardTrigger asChild>
        <div className={cn('whitespace-nowrap font-mono', className)}>
          {format(date, 'LLL dd, y HH:mm:ss')}
        </div>
      </HoverCardTrigger>
      {/* REMINDER: allows us to port the content to the document.body, which is helpful when using opacity-50 on the row element */}
      <HoverCardPortal>
        <HoverCardContent className="z-10 w-auto p-2" {...{ side, align, alignOffset, sideOffset }}>
          <dl className="flex flex-col gap-1">
            <Row value={String(date.getTime())} label="Timestamp" />
            <Row value={format(new UTCDate(date), 'LLL dd, y HH:mm:ss')} label="UTC" />
            <Row value={format(date, 'LLL dd, y HH:mm:ss')} label={timezone} />
            <Row value={formatDistanceToNowStrict(date, { addSuffix: true })} label="Relative" />
          </dl>
        </HoverCardContent>
      </HoverCardPortal>
    </HoverCard>
  )
}

function Row({ value, label }: { value: string; label: string }) {
  const { copy, isCopied } = useCopyToClipboard()

  return (
    <div
      className="group flex items-center justify-between gap-4 text-sm"
      onClick={(e) => {
        e.stopPropagation()
        copy(value)
      }}
    >
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="flex items-center gap-1 truncate font-mono">
        <span className="invisible group-hover:visible">
          {!isCopied ? <Copy className="h-3 w-3" /> : <Check className="h-3 w-3" />}
        </span>
        {value}
      </dd>
    </div>
  )
}
