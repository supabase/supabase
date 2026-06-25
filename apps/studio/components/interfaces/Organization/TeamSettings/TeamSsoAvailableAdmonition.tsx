import { useParams } from 'common'
import Link from 'next/link'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

import { InlineLink } from '@/components/ui/InlineLink'
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
        title="Single Sign-On (SSO) is only available on the Team plan and above"
        layout="responsive"
        description={
          <>
            Enforce login via your company identity provider for added security and access control.
            Available on Team plan and above.{' '}
            <InlineLink href={`${DOCS_URL}/guides/platform/sso`}>Learn more</InlineLink>
          </>
        }
        actions={
          <UpgradePlanButton
            plan="Team"
            source="teamSettingsSSO"
            featureProposition="enable Single Sign-on (SSO)"
          />
        }
      />
    )
  }

  return (
    <Admonition
      type="note"
      title="Set up Single Sign-On (SSO)"
      layout="responsive"
      description={
        <>
          Configure an identity provider to require SSO when inviting team members.{' '}
          <InlineLink href={`${DOCS_URL}/guides/platform/sso`}>Learn more</InlineLink>
        </>
      }
      actions={
        <Button variant="default" asChild>
          <Link href={`/org/${slug}/sso`}>Configure SSO</Link>
        </Button>
      }
    />
  )
}
