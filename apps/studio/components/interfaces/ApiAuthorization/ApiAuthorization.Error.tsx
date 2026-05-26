import type { ReactNode } from 'react'
import { Alert, AlertDescription, AlertTitle, Card, CardContent, CardHeader, WarningIcon } from 'ui'

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
        <Alert variant="warning" className="border-0 rounded-t-none">
          <WarningIcon />
          <AlertTitle>Failed to fetch details for API authorization request</AlertTitle>
          <AlertDescription>
            <p>Please retry your authorization request from the requesting app</p>
            {error && <p className="mt-2">Error: {error?.message}</p>}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
