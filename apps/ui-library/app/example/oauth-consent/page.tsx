import { OAuthConsentCard } from '@/registry/default/blocks/oauth-consent/components/oauth-consent'

export default function OAuthConsentDemo() {
  return (
    <OAuthConsentCard
      clientName="Claude Desktop"
      redirectUri="http://localhost:3000/callback"
      email="alex@example.com"
      scopes={['openid', 'profile']}
    />
  )
}
