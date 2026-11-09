import { Badge, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import {
  getFunctionExecutePrivileges,
  getFunctionPublicAccessKind,
} from './function-api-access.utils'
import type { ExposedFunction } from '@/data/privileges/exposed-functions-infinite-query'

type FunctionExposureBadgeProps = {
  grant: ExposedFunction | undefined
  schemaExposed: boolean
  securityDefiner: boolean
}

const unrestrictedTooltip = (securityDefiner: boolean): string => {
  if (securityDefiner) {
    return 'Anyone can call this SECURITY DEFINER function via the Data API. It runs with the privileges of its owner.'
  }
  return 'Anyone can call this function via the Data API.'
}

export const FunctionExposureBadge = ({
  grant,
  schemaExposed,
  securityDefiner,
}: FunctionExposureBadgeProps) => {
  if (!schemaExposed || !grant) return null

  const privileges = getFunctionExecutePrivileges(grant)
  const accessKind = getFunctionPublicAccessKind(privileges)

  if (accessKind === 'anyone') {
    return (
      <Tooltip>
        <TooltipTrigger className="min-w-4">
          <Badge variant="destructive">Unrestricted</Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-52">
          {unrestrictedTooltip(securityDefiner)}
        </TooltipContent>
      </Tooltip>
    )
  }

  if (accessKind === 'signed-in') {
    return (
      <Tooltip>
        <TooltipTrigger className="min-w-4">
          <Badge variant="warning">Signed-in access</Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-52">
          Signed-in users can call this function via the Data API.
        </TooltipContent>
      </Tooltip>
    )
  }

  return null
}
