import Link from 'next/link'
import type { ReactNode } from 'react'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns'

import { InterstitialLayout, SupabaseLogo } from '@/components/layouts/InterstitialLayout'

export interface ApiAuthorizationInvalidScreenProps {
  missingParameters: Array<string>
}

export function ApiAuthorizationInvalidScreen({
  missingParameters,
}: ApiAuthorizationInvalidScreenProps): ReactNode {
  const isPlural = missingParameters.length > 1

  return (
    <InterstitialLayout logo={<SupabaseLogo />} title="Missing parameters">
      <div className="flex flex-col gap-3 px-6 pb-6">
        <Admonition
          type="warning"
          description={`Cannot authorize this request because the URL is missing the following parameter${
            isPlural ? 's' : ''
          }: ${missingParameters.join(', ')}.`}
        />
        <Button type="default" block asChild>
          <Link href="/">Back to dashboard</Link>
        </Button>
      </div>
    </InterstitialLayout>
  )
}
