'use client'

import { cn } from 'ui'
import Panel from '~/components/Panel'

export default function CalloutCard({
  title,
  body,
  children,
  className,
}: {
  title: string
  body?: string
  children?: React.ReactNode
  className?: string
}) {
  return (
    <Panel
      outerClassName={cn('w-full', className)}
      innerClassName="p-4 md:p-5 flex flex-col gap-2 bg-alternative"
    >
      <p className="text-foreground text-sm font-medium">{title}</p>
      {body && <p className="text-foreground-lighter text-sm whitespace-pre-line">{body}</p>}
      {children}
    </Panel>
  )
}
