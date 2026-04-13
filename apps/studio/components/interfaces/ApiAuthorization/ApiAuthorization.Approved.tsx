import dayjs from 'dayjs'
import type { ReactNode } from 'react'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Card,
  CardContent,
  CardHeader,
  CheckIcon,
} from 'ui'

import { AuthorizeRequesterDetails } from '@/components/interfaces/Organization/OAuthApps/AuthorizeRequesterDetails'
import type { ApiAuthorizationResponse } from '@/data/api-authorization/api-authorization-query'
import type { Organization } from '@/types'

export interface ApiAuthorizationApprovedScreenProps {
  requester: ApiAuthorizationResponse
  organization: Organization | undefined
}

export function ApiAuthorizationApprovedScreen({
  requester,
  organization,
}: ApiAuthorizationApprovedScreenProps): ReactNode {
  return (
    <Card>
      <CardHeader>Authorize API access for {requester.name}</CardHeader>
      <CardContent className="p-0">
        <Alert_Shadcn_ className="border-0 rounded-t-none">
          <CheckIcon />
          <AlertTitle_Shadcn_>This authorization request has been approved</AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>
            <p>
              {requester.name} has been approved access to the organization "
              {organization?.name ?? 'Unknown'}" and all of its projects for the following scopes:
            </p>
            <AuthorizeRequesterDetails
              showOnlyScopes
              icon={requester.icon}
              name={requester.name}
              domain={requester.domain}
              scopes={requester.scopes}
            />
            <p className="mt-2">
              Approved on: {dayjs(requester.approved_at).format('DD MMM YYYY HH:mm:ss (ZZ)')}
            </p>
          </AlertDescription_Shadcn_>
        </Alert_Shadcn_>
      </CardContent>
    </Card>
  )
}
