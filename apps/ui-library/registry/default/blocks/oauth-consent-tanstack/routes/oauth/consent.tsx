import { createFileRoute } from '@tanstack/react-router'

import { OAuthConsent } from '@/registry/default/blocks/oauth-consent/components/oauth-consent'

// This route is installed into the consumer's routes directory. Their TanStack
// route generator adds it to FileRoutesByPath after installation.
// @ts-expect-error The local generated route tree does not include this block route.
export const Route = createFileRoute('/oauth/consent')({
  component: ConsentPage,
  validateSearch: (search) => ({
    authorization_id: typeof search.authorization_id === 'string' ? search.authorization_id : null,
  }),
})

function ConsentPage() {
  const { authorization_id } = Route.useSearch()

  return (
    <main className="flex min-h-svh items-center justify-center p-6 md:p-10">
      <OAuthConsent className="w-full max-w-lg" authorizationId={authorization_id} />
    </main>
  )
}
