import type { PropsWithChildren } from 'react'

import { ActionName, ActionStatus, type ActionRunStep } from 'data/actions/action-runs-query'
import { Badge, StatusIcon, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

export interface ActionStatusBadgeProps {
  name: ActionName
  status: ActionStatus
}

const UNHEALTHY_STATUES: ActionStatus[] = ['DEAD', 'REMOVING']
const WAITING_STATUSES: ActionStatus[] = ['CREATED', 'RESTARTING', 'RUNNING']

export const STATUS_TO_LABEL: Record<ActionStatus, string> = {
  CREATED: 'pending',
  DEAD: 'failed',
  EXITED: 'succeeded',
  PAUSED: 'skipped',
  REMOVING: 'failed',
  RESTARTING: 'restarting',
  RUNNING: 'running',
}

const NAME_TO_LABEL: Record<ActionName, string> = {
  clone: 'Cloning repo',
  pull: 'Pulling data',
  health: 'Health check',
  configure: 'Configurations',
  migrate: 'Migrations',
  seed: 'Data seeding',
  deploy: 'Functions deployment',
}

export const ActionStatusBadgeCondensed = ({
  children,
  status,
  details,
}: PropsWithChildren<{
  status: ActionStatus
  details: Array<ActionRunStep>
}>) => {
  if (status === 'EXITED') {
    return null
  }

  const isUnhealthy = UNHEALTHY_STATUES.includes(status)
  const isWaiting = WAITING_STATUSES.includes(status)

  return (
    <Tooltip>
      <TooltipTrigger>
        <Badge variant={isUnhealthy ? 'destructive' : 'default'} className="gap-1.5">
          {(isUnhealthy || isWaiting) && (
            <StatusIcon variant={isUnhealthy ? 'destructive' : 'default'} hideBackground />
          )}
          {children}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        Additional {STATUS_TO_LABEL[status]} steps:
        <ul>
          {details.map((step) => (
            <li key={step.name} className="before:content-['-'] before:mr-0.5">
              {NAME_TO_LABEL[step.name]}
            </li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  )
}

export const ActionStatusBadge = ({ name, status }: ActionStatusBadgeProps) => {
  if (status === 'EXITED') {
    return null
  }

  const isUnhealthy = UNHEALTHY_STATUES.includes(status)
  const isWaiting = WAITING_STATUSES.includes(status)

  return (
    <Badge variant={isUnhealthy ? 'destructive' : 'default'} className="gap-1.5">
      {(isUnhealthy || isWaiting) && (
        <StatusIcon variant={isUnhealthy ? 'destructive' : 'default'} hideBackground />
      )}
      {NAME_TO_LABEL[name]}: {STATUS_TO_LABEL[status]}
    </Badge>
  )
}
