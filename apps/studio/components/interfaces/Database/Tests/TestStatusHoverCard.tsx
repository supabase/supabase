import { HoverCard, HoverCardContent, HoverCardTrigger } from 'ui'
import dayjs from 'dayjs'
import { ReactNode } from 'react'

export type TestStatusType = 'queued' | 'running' | 'passed' | 'failed' | undefined

interface TestStatusHoverCardProps {
  name: string
  status: TestStatusType
  lastRun?: string
  errorMessage?: string
  children: ReactNode
}

const getStatusDescription = (status: TestStatusType) => {
  switch (status) {
    case 'running':
      return 'Currently running'
    case 'queued':
      return 'Queued for execution'
    case 'passed':
      return 'Completed successfully'
    case 'failed':
      return 'Failed'
    default:
      return 'Pending execution'
  }
}

const formatLastRun = (dateStr?: string) => {
  if (!dateStr) return 'Never'
  const date = dayjs(dateStr)
  return date.fromNow()
}

export const TestStatusHoverCard = ({
  name,
  status,
  lastRun,
  errorMessage,
  children,
}: TestStatusHoverCardProps) => {
  return (
    <HoverCard openDelay={150} closeDelay={100}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="w-64 p-3 space-y-2 text-sm" align="center" side="top">
        <p className="font-medium text-foreground">{name}</p>
        <div className="text-xs text-foreground-light space-y-1">
          <p>Status: {getStatusDescription(status)}</p>
          <p>Last run: {formatLastRun(lastRun)}</p>
          {status === 'failed' && errorMessage && (
            <div className="mt-2 rounded border border-destructive-500 bg-destructive-100 p-2 text-destructive-600 text-xs whitespace-pre-wrap">
              {errorMessage}
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

export default TestStatusHoverCard
