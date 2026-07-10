import Link from 'next/link'
import type { ReactNode } from 'react'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

import { InterstitialLayout, SupabaseLogo } from '@/components/layouts/InterstitialLayout'

export interface ApiAuthorizationInvalidScreenProps {
  missingParameters: Array<string>
}

export function ApiAuthorizationInvalidScreen({
  missingParameters,
}: ApiAuthorizationInvalidScreenProps): ReactNode {
  const isPlural = missingParameters.length > 1

  return (
    <InterstitialLayout
      logo={<SupabaseLogo />}
      title="Missing authorization link"
      description="This authorization request cannot be completed"
    >
      <div className="flex flex-col gap-3 px-6 pb-6">
        <Admonition
          type="warning"
          title="Retry the authorization request from the requesting app. "
          description={`The URL is missing parameter${
            isPlural ? 's' : ''
          }: ${missingParameters.join(', ')}.`}
        />
        <Button variant="default" block asChild>
          <Link href="/">Back to dashboard</Link>
        </Button>
      </div>
    </InterstitialLayout>
  )
}
