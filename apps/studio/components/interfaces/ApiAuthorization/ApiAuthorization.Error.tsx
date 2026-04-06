import type { ReactNode } from 'react'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Card,
  CardContent,
  CardHeader,
  WarningIcon,
} from 'ui'

import type { ResourceError } from '@/data/api-authorization/api-authorization-query'

export interface ApiAuthorizationErrorScreenProps {
  error: ResourceError | undefined
}

export function ApiAuthorizationErrorScreen({
  error,
}: ApiAuthorizationErrorScreenProps): ReactNode {
  return (
    <Card>
      <CardHeader>Authorize API access</CardHeader>
      <CardContent className="p-0">
        <Alert_Shadcn_ variant="warning" className="border-0 rounded-t-none">
          <WarningIcon />
          <AlertTitle_Shadcn_>
            Failed to fetch details for API authorization request
          </AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>
            <p>Please retry your authorization request from the requesting app</p>
            {error && <p className="mt-2">Error: {error?.message}</p>}
          </AlertDescription_Shadcn_>
        </Alert_Shadcn_>
      </CardContent>
    </Card>
  )
}
