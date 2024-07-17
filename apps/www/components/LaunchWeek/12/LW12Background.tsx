import React, { FC, PropsWithChildren } from 'react'
import { range } from 'lodash'
import { EyeOff } from 'lucide-react'
import { Checkbox_Shadcn_ as Checkbox, cn, Skeleton } from 'ui'

interface Props {
  className?: string
}

const LW12Background = ({ className }: Props) => {
  const rows = range(0, 40).map((_, i) => ({
    id: i,
    name: 'name',
    username: '',
    ticketNo: i,
    createdAt: '',
  }))

  return (
    <div className={cn('absolute inset-0 w-full h-full flex flex-col', className)}>
      <div className="absolute inset-0 bg-gradient-to-t from-background-alternative to-transparent" />
      {rows?.map((row, i) => <Row key={`row-${i}`} {...row} />)}
    </div>
  )
}

interface CellProps {
  className?: string
}

const Cell: FC<PropsWithChildren<CellProps>> = ({ className, ...props }) => (
  <span
    className={cn(
      'h-10 p-2 flex items-center border-r border-background-alternative-200 last:border-r-0',
      className
    )}
    {...props}
  />
)

const Row = () => (
  <div className="flex w-full border-background-alternative-200 border-b first:border-t">
    <Cell className="flex-[1] justify-center">
      <Checkbox disabled />
    </Cell>
    <Cell className="flex-[1] justify-center">
      <EyeOff className="h-4 w-4 text-foreground-muted/20" />
    </Cell>
    <Cell className="flex-[3]">
      <Skeleton className="h-4 w-full !animate-none bg-alternative-200" />
    </Cell>
    <Cell className="flex-[5]">
      <Skeleton className="h-4 w-full !animate-none bg-alternative-200" />
    </Cell>
    <Cell className="flex-[5] hidden sm:flex">
      <Skeleton className="h-4 w-full !animate-none bg-alternative-200" />
    </Cell>
    <Cell className="flex-[5] hidden md:flex">
      <Skeleton className="h-4 w-full !animate-none bg-alternative-200" />
    </Cell>
    <Cell className="flex-[5] hidden lg:flex">
      <Skeleton className="h-4 w-full !animate-none bg-alternative-200" />
    </Cell>
  </div>
)

export default LW12Background
