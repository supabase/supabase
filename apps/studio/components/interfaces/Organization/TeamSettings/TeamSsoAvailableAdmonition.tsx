import { useParams } from 'common'
import Link from 'next/link'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

import { DocsButton } from '@/components/ui/DocsButton'
import { UpgradePlanButton } from '@/components/ui/UpgradePlanButton'
import { useOrgSSOConfigQuery } from '@/data/sso/sso-config-query'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import { DOCS_URL } from '@/lib/constants'

export function TeamSsoAvailableAdmonition() {
  const { slug } = useParams()
  const { hasAccess: hasAccessToSso } = useCheckEntitlements('auth.platform.sso')
  const { data: ssoConfig } = useOrgSSOConfigQuery({ orgSlug: slug })
  const hasSsoProvider = !!ssoConfig && ssoConfig !== null

  if (hasAccessToSso && hasSsoProvider) return null

  if (!hasAccessToSso) {
    return (
      <Admonition
        type="note"
        title="Single Sign-On (SSO) available"
        description="Enforce login via your company identity provider for added security and access control. Available on Team plan and above."
        actions={
          <>
            <DocsButton href={`${DOCS_URL}/guides/platform/sso`} />
            <UpgradePlanButton
              plan="Team"
              source="teamSettingsSSO"
              featureProposition="enable Single Sign-on (SSO)"
            />
          </>
        }
      />
    )
  }

  return (
    <Admonition
      type="note"
      title="Set up Single Sign-On (SSO)"
      layout="responsive"
      description="Configure an identity provider to require SSO when inviting team members."
      actions={
        <Button variant="default" asChild>
          <Link href={`/org/${slug}/sso`}>Configure SSO</Link>
        </Button>
      }
    />
  )
}
