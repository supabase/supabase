import { OAuthConsent } from '@/registry/default/blocks/oauth-consent/components/oauth-consent'

export default async function ConsentPage({
  searchParams,
}: {
  searchParams: Promise<{ authorization_id?: string }>
}) {
  const { authorization_id } = await searchParams

  return (
    <main className="flex min-h-svh items-center justify-center p-6 md:p-10">
      <OAuthConsent className="w-full max-w-lg" authorizationId={authorization_id} />
    </main>
  )
}
