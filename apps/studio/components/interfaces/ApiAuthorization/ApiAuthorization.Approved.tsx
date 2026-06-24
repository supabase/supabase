import dayjs from 'dayjs'
import type { ReactNode } from 'react'
import { Admonition } from 'ui-patterns'

import {
  AuthorizeRequesterDetails,
  RequesterLogo,
} from '@/components/interfaces/Organization/OAuthApps/AuthorizeRequesterDetails'
import { InterstitialLayout, LogoPair, SupabaseLogo } from '@/components/layouts/InterstitialLayout'
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
  const organizationName = organization?.name ?? 'Unknown'

  return (
    <InterstitialLayout
      logo={
        <LogoPair
          left={<RequesterLogo icon={requester.icon} name={requester.name} />}
          right={<SupabaseLogo />}
        />
      }
      title={requester.name}
      description="is authorized for Supabase"
    >
      <div className="flex flex-col gap-5 px-6 pb-6">
        <Admonition
          type="success"
          title="Authorization approved"
          description={`${requester.name} has access to ${organizationName} and its projects.`}
        />
        <AuthorizeRequesterDetails
          showOnlyScopes
          icon={requester.icon}
          name={requester.name}
          domain={requester.domain}
          scopes={requester.scopes}
        />
        <p className="text-center text-xs text-foreground-lighter">
          Approved on {dayjs(requester.approved_at).format('DD MMM YYYY HH:mm:ss (ZZ)')}.
        </p>
      </div>
    </InterstitialLayout>
  )
}
