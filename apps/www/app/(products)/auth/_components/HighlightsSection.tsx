import SectionContainerWithCn from '~/components/Layouts/SectionContainerWithCn'
import { Check } from 'lucide-react'
import Link from 'next/link'
import { Button } from 'ui'

const HIGHLIGHTS = [
  {
    title: 'Multi-Factor Authentication',
    features: [
      'Time-based one-time passwords (TOTP)',
      'Works with any authenticator app',
      'Enforce MFA for specific user roles',
      'Built-in enrollment and challenge flows',
    ],
    cta: { label: 'Learn more', href: '/docs/guides/auth/auth-mfa' },
  },
  {
    title: 'Enterprise SSO',
    features: [
      'SAML 2.0 support for identity providers',
      'Connect to Azure AD, Okta, and more',
      'Automatic user provisioning on sign-in',
      'Manage SSO from the Dashboard or API',
    ],
    cta: { label: 'Learn more', href: '/docs/guides/auth/enterprise-sso/auth-sso-saml' },
  },
  {
    title: 'Custom OIDC Providers',
    features: [
      'OpenID Connect support for any identity provider',
      'Connect to Auth0, Keycloak, Amazon Cognito, and more',
      'PKCE security by default',
      'Configure providers from the Dashboard or API',
    ],
    cta: { label: 'Learn more', href: '/features/custom-oidc-providers' },
  },
]

export function HighlightsSection() {
  return (
    <SectionContainerWithCn spacing="sections">
      {/* Header */}
      <h3 className="text-2xl md:text-4xl text-foreground-lighter max-w-xl">
        Enterprise ready
        <br />
        <span className="text-foreground">security at every level</span>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {HIGHLIGHTS.map((highlight) => (
          <div
            key={highlight.title}
            className="relative flex flex-col overflow-hidden md:min-h-[400px] bg-surface-75 border border-border rounded-lg"
          >
            <div className="relative z-10 flex flex-col justify-between h-full p-6 md:p-8">
              <div className="flex flex-col gap-4">
                <h4 className="text-foreground text-lg font-medium">{highlight.title}</h4>
                <ul className="flex flex-col text-foreground-lighter text-sm gap-1.5">
                  {highlight.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 stroke-2 text-brand" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6">
                <Button variant="default" size="small" asChild>
                  <Link href={highlight.cta.href}>{highlight.cta.label}</Link>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionContainerWithCn>
  )
}
