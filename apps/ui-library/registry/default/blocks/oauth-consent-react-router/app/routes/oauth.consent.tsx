import { useSearchParams } from 'react-router'

import { OAuthConsent } from '@/registry/default/blocks/oauth-consent/components/oauth-consent'

export default function ConsentRoute() {
  const [searchParams] = useSearchParams()

  return (
    <main className="flex min-h-svh items-center justify-center p-6 md:p-10">
      <OAuthConsent
        className="w-full max-w-lg"
        authorizationId={searchParams.get('authorization_id')}
      />
    </main>
  )
}
