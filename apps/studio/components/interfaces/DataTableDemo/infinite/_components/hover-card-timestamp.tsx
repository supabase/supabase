'use client'

import { HoverCard, HoverCardContent, HoverCardTrigger } from 'ui'
import { useCopyToClipboard } from 'components/interfaces/DataTableDemo/hooks/use-copy-to-clipboard'
import { cn } from 'ui'
import { UTCDate } from '@date-fns/utc'
import { HoverCardPortal } from '@radix-ui/react-hover-card'
import { format, formatDistanceToNowStrict } from 'date-fns'
import { Copy } from 'lucide-react'
import { Check } from 'lucide-react'
import type { ComponentPropsWithoutRef } from 'react'
import { TimestampInfo } from 'ui-patterns'

type HoverCardContentProps = ComponentPropsWithoutRef<typeof HoverCardContent>

interface HoverCardTimestampProps {
  date: Date
  side?: HoverCardContentProps['side']
  sideOffset?: HoverCardContentProps['sideOffset']
  align?: HoverCardContentProps['align']
  alignOffset?: HoverCardContentProps['alignOffset']
  className?: string
}

export function HoverCardTimestamp({
  date,
  side = 'right',
  align = 'start',
  alignOffset = -4,
  sideOffset,
  className,
}: HoverCardTimestampProps) {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  return (
    // <HoverCard openDelay={0} closeDelay={0}>
    //   <HoverCardTrigger asChild>
    //     <div className={cn('font-mono flex gap-1.5', className)}>
    //       <span className="text-foreground/50 uppercase">{format(date, 'MMM')}</span>
    //       <span className="text-foreground/50 uppercase"> {format(date, 'dd')} </span>
    //       <span>
    //         {format(date, 'HH:mm:ss')}
    //         <span className="text-foreground/50">.{format(date, 'SS')}</span>
    //       </span>
    //     </div>
    //   </HoverCardTrigger>
    //   {/* REMINDER: allows us to port the content to the document.body, which is helpful when using opacity-50 on the row element */}
    //   <HoverCardPortal>
    //     <HoverCardContent className="p-2 w-auto z-10" {...{ side, align, alignOffset, sideOffset }}>
    //       <dl className="flex flex-col gap-1">
    //         <Row value={String(date.getTime())} label="Timestamp" />
    //         <Row value={format(new UTCDate(date), 'LLL dd, y HH:mm:ss')} label="UTC" />
    //         <Row value={format(date, 'LLL dd, y HH:mm:ss')} label={timezone} />
    //         <Row value={formatDistanceToNowStrict(date, { addSuffix: true })} label="Relative" />
    //       </dl>
    //     </HoverCardContent>
    //   </HoverCardPortal>
    // </HoverCard>

    <div className="relative w-fit">
      <TimestampInfo utcTimestamp={date.getTime()}>
        <div className={cn('font-mono flex gap-1.5', className)}>
          <span className="text-foreground/50 uppercase">{format(date, 'MMM')}</span>
          <span className="text-foreground/50 uppercase"> {format(date, 'dd')} </span>
          <span>
            {format(date, 'HH:mm:ss')}
            <span className="text-foreground/50">.{format(date, 'SS')}</span>
          </span>
        </div>
      </TimestampInfo>
    </div>
  )
}

function Row({ value, label }: { value: string; label: string }) {
  const { copy, isCopied } = useCopyToClipboard()

  return (
    <div
      className="group flex gap-4 text-sm justify-between items-center"
      onClick={(e) => {
        e.stopPropagation()
        copy(value)
      }}
    >
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-mono truncate flex items-center gap-1">
        <span className="invisible group-hover:visible">
          {!isCopied ? <Copy className="h-3 w-3" /> : <Check className="h-3 w-3" />}
        </span>
        {value}
      </dd>
    </div>
  )
}
